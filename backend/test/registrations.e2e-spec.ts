import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { EVENT_REPOSITORY } from '../src/application/events/ports/event-repository.js';
import { MAILER } from '../src/application/notifications/ports/mailer.js';
import { REGISTRATION_REPOSITORY } from '../src/application/registrations/ports/registration-repository.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { AgendaEvent } from '../src/domain/events/agenda-event.js';
import { Role } from '../src/domain/users/role.js';
import { User } from '../src/domain/users/user.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { EventsPersistenceModule } from '../src/modules/events-persistence.module.js';
import { NotificationsModule } from '../src/modules/notifications.module.js';
import { RegistrationsPersistenceModule } from '../src/modules/registrations-persistence.module.js';
import { RegistrationsModule } from '../src/modules/registrations.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemoryEventRepository } from './support/in-memory-event-repository.js';
import { InMemoryMailer } from './support/in-memory-mailer.js';
import { InMemoryRegistrationRepository } from './support/in-memory-registration-repository.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const users = new InMemoryUserRepository();
const events = new InMemoryEventRepository();
const mailer = new InMemoryMailer();

@Module({
  providers: [
    { provide: USER_REPOSITORY, useValue: users },
    { provide: SESSION_REPOSITORY, useValue: new InMemorySessionRepository() },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY],
})
class InMemoryAuthPersistenceModule {}

@Module({
  providers: [{ provide: EVENT_REPOSITORY, useValue: events }],
  exports: [EVENT_REPOSITORY],
})
class InMemoryEventsPersistenceModule {}

@Module({
  providers: [
    {
      provide: REGISTRATION_REPOSITORY,
      useValue: new InMemoryRegistrationRepository(),
    },
  ],
  exports: [REGISTRATION_REPOSITORY],
})
class InMemoryRegistrationsPersistenceModule {}

@Module({
  providers: [{ provide: MAILER, useValue: mailer }],
  exports: [MAILER],
})
class InMemoryNotificationsModule {}

const testEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'no-se-usa',
  DB_PASSWORD: 'no-se-usa',
  DB_NAME: 'no-se-usa',
  JWT_ACCESS_SECRET: 'secreto-de-prueba-e2e-con-mas-de-32-caracteres',
};

const EVENT_ID = '7d0c2f4e-1b9a-4f3e-8c2d-5a6b7c8d9e0f';
const FULL_EVENT_ID = '3a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const DAY_MS = 24 * 60 * 60 * 1000;

function publishedEvent(id: string, capacity: number): AgendaEvent {
  const now = Date.now();
  return AgendaEvent.create({
    id,
    title: 'Noche de museos',
    location: 'Museo de la Aduana',
    startsAt: new Date(now + 10 * DAY_MS),
    capacity,
    publishFrom: new Date(now - DAY_MS),
    publishUntil: new Date(now + 10 * DAY_MS),
    now: new Date(now - DAY_MS),
  });
}

describe('Inscripciones (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  async function tokenFor(correo: string, role: Role): Promise<string> {
    const credentials = { correo, contrasena: 'secreta123' };
    const created = await http
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Persona', ...credentials, aceptaPrivacidad: true })
      .expect(201);
    const user = (await users.findById(created.body.id as string))!;
    users.users.set(
      user.id,
      User.restore({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role,
        privacyConsentAt: user.privacyConsentAt,
        privacyNoticeVersion: user.privacyNoticeVersion,
        createdAt: user.createdAt,
      }),
    );
    const login = await http
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);
    return login.body.tokenAcceso as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: () => validateEnvironment(testEnvironment),
        }),
        AuthModule,
        RegistrationsModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .overrideModule(EventsPersistenceModule)
      .useModule(InMemoryEventsPersistenceModule)
      .overrideModule(RegistrationsPersistenceModule)
      .useModule(InMemoryRegistrationsPersistenceModule)
      .overrideModule(NotificationsModule)
      .useModule(InMemoryNotificationsModule)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    await events.save(publishedEvent(EVENT_ID, 10));
    await events.save(publishedEvent(FULL_EVENT_ID, 1));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/eventos/:id/inscripciones', () => {
    const url = `/api/v1/eventos/${EVENT_ID}/inscripciones`;

    it('inscribe sin cuenta y envía el correo de confirmación', async () => {
      const res = await http
        .post(url)
        .send({
          nombre: 'Ana Pérez',
          correo: ' Ana@Correo.com ',
          aceptaPrivacidad: true,
        })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        eventoId: EVENT_ID,
        eventoTitulo: 'Noche de museos',
        nombre: 'Ana Pérez',
        correo: 'ana@correo.com',
        creadoEn: expect.any(String),
        correoEnviado: true,
      });
      expect(mailer.sent.at(-1)).toMatchObject({
        to: 'ana@correo.com',
        subject: 'Inscripción confirmada: Noche de museos',
      });
    });

    it('sin aceptar el aviso de privacidad responde 422 y no inscribe', async () => {
      const res = await http
        .post(url)
        .send({
          nombre: 'Bea',
          correo: 'bea@correo.com',
          aceptaPrivacidad: false,
        })
        .expect(422);

      expect(res.body.codigo).toBe('CONSENTIMIENTO_REQUERIDO');
    });

    it('el mismo correo dos veces responde 409 YA_INSCRITO', async () => {
      const res = await http
        .post(url)
        .send({
          nombre: 'Ana',
          correo: 'ana@correo.com',
          aceptaPrivacidad: true,
        })
        .expect(409);

      expect(res.body.codigo).toBe('YA_INSCRITO');
    });

    it('sin cupos responde 409 EVENTO_SIN_CUPOS', async () => {
      const fullUrl = `/api/v1/eventos/${FULL_EVENT_ID}/inscripciones`;
      await http
        .post(fullUrl)
        .send({
          nombre: 'Uno',
          correo: 'uno@correo.com',
          aceptaPrivacidad: true,
        })
        .expect(201);

      const res = await http
        .post(fullUrl)
        .send({
          nombre: 'Dos',
          correo: 'dos@correo.com',
          aceptaPrivacidad: true,
        })
        .expect(409);

      expect(res.body).toMatchObject({
        codigo: 'EVENTO_SIN_CUPOS',
        mensaje: 'El evento ya no tiene cupos disponibles',
      });
    });

    it('un evento que no existe o un id que no es UUID responde 404', async () => {
      const body = {
        nombre: 'Ana',
        correo: 'x@correo.com',
        aceptaPrivacidad: true,
      };
      await http
        .post(
          '/api/v1/eventos/00000000-0000-4000-8000-000000000000/inscripciones',
        )
        .send(body)
        .expect(404);
      await http
        .post('/api/v1/eventos/no-es-un-id/inscripciones')
        .send(body)
        .expect(404);
    });

    it('responde 400 con mensajes en español si faltan datos', async () => {
      const res = await http
        .post(url)
        .send({ correo: 'no-es-correo' })
        .expect(400);

      const fields = (res.body.detalles as { campo: string }[]).map(
        (d) => d.campo,
      );
      expect(fields).toEqual(
        expect.arrayContaining(['nombre', 'correo', 'aceptaPrivacidad']),
      );
    });
  });

  describe('GET /api/v1/eventos/:id/inscripciones', () => {
    const url = `/api/v1/eventos/${EVENT_ID}/inscripciones`;
    let staffToken: string;
    let publicToken: string;

    beforeAll(async () => {
      staffToken = await tokenFor('personal@clena.org', Role.Staff);
      publicToken = await tokenFor('publico@correo.com', Role.Public);
      for (const [nombre, correo] of [
        ['Bea Gómez', 'bea@correo.com'],
        ['Carlos Ruiz', 'carlos@correo.com'],
      ]) {
        await http
          .post(url)
          .send({ nombre, correo, aceptaPrivacidad: true })
          .expect(201);
      }
    });

    it('el personal ve los inscritos paginados', async () => {
      const res = await http
        .get(`${url}?pagina=1&tamano=2`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ total: 3, pagina: 1, tamano: 2 });
      expect(
        res.body.elementos.map((r: { nombre: string }) => r.nombre),
      ).toEqual(['Ana Pérez', 'Bea Gómez']);
      expect(res.body.elementos[0]).toEqual({
        id: expect.any(String),
        nombre: 'Ana Pérez',
        correo: 'ana@correo.com',
        creadoEn: expect.any(String),
      });
    });

    it('busca por nombre o correo', async () => {
      const res = await http
        .get(`${url}?buscar=CARLOS`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.elementos[0].correo).toBe('carlos@correo.com');
    });

    it('sin sesión responde 401 y un usuario público 403', async () => {
      await http.get(url).expect(401);
      await http
        .get(url)
        .set('Authorization', `Bearer ${publicToken}`)
        .expect(403);
    });

    it('rechaza una paginación inválida', async () => {
      const res = await http
        .get(`${url}?pagina=0&tamano=500`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);

      expect(res.body.detalles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ campo: 'pagina' }),
          expect.objectContaining({ campo: 'tamano' }),
        ]),
      );
    });
  });
});
