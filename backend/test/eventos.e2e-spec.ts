import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { EVENT_REPOSITORY } from '../src/application/events/ports/event-repository.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { Role } from '../src/domain/users/role.js';
import { User } from '../src/domain/users/user.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { EventsPersistenceModule } from '../src/modules/events-persistence.module.js';
import { EventsModule } from '../src/modules/events.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemoryEventRepository } from './support/in-memory-event-repository.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const users = new InMemoryUserRepository();
const events = new InMemoryEventRepository();

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

const testEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'no-se-usa',
  DB_PASSWORD: 'no-se-usa',
  DB_NAME: 'no-se-usa',
  JWT_ACCESS_SECRET: 'secreto-de-prueba-e2e-con-mas-de-32-caracteres',
};

/** Fecha ISO con zona horaria, a `days` días de ahora. */
function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function eventBody(overrides: Record<string, unknown> = {}) {
  return {
    titulo: 'Noche de jazz en la Aduana',
    descripcion: 'Concierto en el patio central.',
    lugar: 'Patio central',
    inicio: inDays(10),
    cupo: 40,
    publicarDesde: inDays(-1),
    publicarHasta: inDays(10),
    ...overrides,
  };
}

describe('Agenda de eventos (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let staffToken: string;
  let adminToken: string;
  let publicToken: string;

  /** Registra una cuenta y, si se pide otro rol, la asciende en el repositorio en memoria. */
  async function sessionFor(
    nombre: string,
    correo: string,
    role: Role = Role.Public,
  ) {
    const credentials = { correo, contrasena: 'secreta123' };
    await http
      .post('/api/v1/auth/registro')
      .send({ nombre, ...credentials, aceptaPrivacidad: true })
      .expect(201);
    if (role !== Role.Public) {
      const user = (await users.findByEmail(correo))!;
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
    }
    const login = await http
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);
    return login.body.tokenAcceso as string;
  }

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  function create(token: string, body: Record<string, unknown>) {
    return http.post('/api/v1/eventos').set(auth(token)).send(body);
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
        EventsModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .overrideModule(EventsPersistenceModule)
      .useModule(InMemoryEventsPersistenceModule)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    staffToken = await sessionFor(
      'Personal',
      'personal@clena.test',
      Role.Staff,
    );
    adminToken = await sessionFor('Admin', 'admin@clena.test', Role.Admin);
    publicToken = await sessionFor('Visitante', 'visitante@clena.test');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    events.events.clear();
  });

  describe('POST /api/v1/eventos', () => {
    it('el personal programa un evento y queda publicado si ya está en su periodo', async () => {
      const response = await create(staffToken, eventBody()).expect(201);

      expect(response.body).toMatchObject({
        titulo: 'Noche de jazz en la Aduana',
        lugar: 'Patio central',
        cupo: 40,
        estado: 'publicado',
      });
    });

    it('acepta la hora de Colombia y la guarda en UTC', async () => {
      const response = await create(
        adminToken,
        eventBody({
          inicio: '2099-11-21T19:00:00-05:00',
          publicarHasta: '2099-11-21T19:00:00-05:00',
        }),
      ).expect(201);

      expect(response.body.inicio).toBe('2099-11-22T00:00:00.000Z');
    });

    it('rechaza fechas sin zona horaria, campos faltantes y cupos inválidos', async () => {
      const response = await create(
        staffToken,
        eventBody({ inicio: '2099-11-21T19:00:00', lugar: '', cupo: 0 }),
      ).expect(400);

      const fields = response.body.detalles.map(
        (d: { campo: string }) => d.campo,
      );
      expect(fields).toEqual(
        expect.arrayContaining(['inicio', 'lugar', 'cupo']),
      );
    });

    it('no deja que la publicación termine antes de empezar', async () => {
      const response = await create(
        staffToken,
        eventBody({ publicarDesde: inDays(3), publicarHasta: inDays(2) }),
      ).expect(422);

      expect(response.body.codigo).toBe('PERIODO_DE_PUBLICACION_NO_VALIDO');
    });

    it('un usuario público no puede, y sin sesión tampoco', async () => {
      await create(publicToken, eventBody()).expect(403);
      await http.post('/api/v1/eventos').send(eventBody()).expect(401);
      expect(events.events.size).toBe(0);
    });
  });

  describe('GET /api/v1/eventos', () => {
    beforeEach(async () => {
      await create(
        staffToken,
        eventBody({
          titulo: 'Feria del libro',
          inicio: inDays(20),
          publicarHasta: inDays(20),
        }),
      ).expect(201);
      await create(
        staffToken,
        eventBody({
          titulo: 'Taller de fotografía',
          lugar: 'Sala de exposiciones',
          inicio: inDays(5),
          publicarHasta: inDays(5),
        }),
      ).expect(201);
      await create(
        staffToken,
        eventBody({
          titulo: 'Visita al Archivo',
          publicarDesde: inDays(7),
          publicarHasta: inDays(30),
          inicio: inDays(30),
        }),
      ).expect(201);
    });

    it('cualquiera ve los publicados, del más próximo al más lejano', async () => {
      const response = await http.get('/api/v1/eventos').expect(200);

      expect(
        response.body.datos.map((e: { titulo: string }) => e.titulo),
      ).toEqual(['Taller de fotografía', 'Feria del libro']);
      expect(response.body).toMatchObject({ pagina: 1, total: 2 });
    });

    it('busca por título o lugar', async () => {
      const response = await http
        .get('/api/v1/eventos')
        .query({ buscar: 'EXPOSICIONES' })
        .expect(200);

      expect(response.body.datos).toHaveLength(1);
      expect(response.body.datos[0].titulo).toBe('Taller de fotografía');
    });

    it('rechaza un tamaño de página mayor que 50', async () => {
      await http.get('/api/v1/eventos').query({ porPagina: 51 }).expect(400);
    });
  });

  describe('GET /api/v1/eventos/gestion', () => {
    beforeEach(async () => {
      await create(staffToken, eventBody({ titulo: 'Publicado' })).expect(201);
      await create(
        staffToken,
        eventBody({
          titulo: 'Pendiente',
          publicarDesde: inDays(7),
          publicarHasta: inDays(30),
          inicio: inDays(30),
        }),
      ).expect(201);
    });

    it('el personal ve todos, con su estado', async () => {
      const response = await http
        .get('/api/v1/eventos/gestion')
        .set(auth(staffToken))
        .expect(200);

      expect(
        response.body.datos.map((e: { titulo: string; estado: string }) => [
          e.titulo,
          e.estado,
        ]),
      ).toEqual([
        ['Publicado', 'publicado'],
        ['Pendiente', 'pendiente'],
      ]);
    });

    it('filtra por estado', async () => {
      const response = await http
        .get('/api/v1/eventos/gestion')
        .query({ estado: 'pendiente' })
        .set(auth(adminToken))
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.datos[0].titulo).toBe('Pendiente');
    });

    it('rechaza un estado que no existe', async () => {
      await http
        .get('/api/v1/eventos/gestion')
        .query({ estado: 'borrador' })
        .set(auth(staffToken))
        .expect(400);
    });

    it('un usuario público no puede, y sin sesión tampoco', async () => {
      await http
        .get('/api/v1/eventos/gestion')
        .set(auth(publicToken))
        .expect(403);
      await http.get('/api/v1/eventos/gestion').expect(401);
    });
  });

  describe('PATCH /api/v1/eventos/:id', () => {
    it('el personal cambia solo lo que envía', async () => {
      const created = await create(staffToken, eventBody()).expect(201);

      const response = await http
        .patch(`/api/v1/eventos/${created.body.id}`)
        .set(auth(staffToken))
        .send({ cupo: 60, publicarDesde: inDays(2) })
        .expect(200);

      expect(response.body).toMatchObject({
        titulo: 'Noche de jazz en la Aduana',
        cupo: 60,
        estado: 'pendiente',
      });
    });

    it('valida el periodo con la fecha que ya tenía', async () => {
      const created = await create(staffToken, eventBody()).expect(201);

      await http
        .patch(`/api/v1/eventos/${created.body.id}`)
        .set(auth(staffToken))
        .send({ publicarHasta: inDays(-2) })
        .expect(422);
    });

    it('responde 404 si el evento no existe o el id no es válido', async () => {
      await http
        .patch('/api/v1/eventos/5e7d2c10-4b1a-4f3e-9a6d-1c2b3a4d5eff')
        .set(auth(staffToken))
        .send({ cupo: 5 })
        .expect(404);
      await http
        .patch('/api/v1/eventos/no-es-un-id')
        .set(auth(staffToken))
        .send({ cupo: 5 })
        .expect(404);
    });

    it('un usuario público no puede', async () => {
      const created = await create(staffToken, eventBody()).expect(201);

      await http
        .patch(`/api/v1/eventos/${created.body.id}`)
        .set(auth(publicToken))
        .send({ cupo: 1 })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/eventos/:id', () => {
    it('el personal elimina un evento y ya no aparece', async () => {
      const created = await create(staffToken, eventBody()).expect(201);

      await http
        .delete(`/api/v1/eventos/${created.body.id}`)
        .set(auth(staffToken))
        .expect(204);
      await http
        .delete(`/api/v1/eventos/${created.body.id}`)
        .set(auth(staffToken))
        .expect(404);

      const agenda = await http.get('/api/v1/eventos').expect(200);
      expect(agenda.body.total).toBe(0);
    });

    it('un usuario público no puede', async () => {
      const created = await create(staffToken, eventBody()).expect(201);

      await http
        .delete(`/api/v1/eventos/${created.body.id}`)
        .set(auth(publicToken))
        .expect(403);
    });
  });
});
