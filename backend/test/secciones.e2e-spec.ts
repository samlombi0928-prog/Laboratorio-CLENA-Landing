import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { SECTION_ITEM_REPOSITORY } from '../src/application/sections/ports/section-item-repository.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { Role } from '../src/domain/users/role.js';
import { User } from '../src/domain/users/user.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { SectionsPersistenceModule } from '../src/modules/sections-persistence.module.js';
import { SectionsModule } from '../src/modules/sections.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemorySectionItemRepository } from './support/in-memory-section-item-repository.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const users = new InMemoryUserRepository();
const sections = new InMemorySectionItemRepository();

@Module({
  providers: [
    { provide: USER_REPOSITORY, useValue: users },
    { provide: SESSION_REPOSITORY, useValue: new InMemorySessionRepository() },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY],
})
class InMemoryAuthPersistenceModule {}

@Module({
  providers: [{ provide: SECTION_ITEM_REPOSITORY, useValue: sections }],
  exports: [SECTION_ITEM_REPOSITORY],
})
class InMemorySectionsPersistenceModule {}

const testEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'no-se-usa',
  DB_PASSWORD: 'no-se-usa',
  DB_NAME: 'no-se-usa',
  JWT_ACCESS_SECRET: 'secreto-de-prueba-e2e-con-mas-de-32-caracteres',
};

describe('Secciones de la landing (e2e)', () => {
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
    return http.post('/api/v1/secciones').set(auth(token)).send(body);
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
        SectionsModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .overrideModule(SectionsPersistenceModule)
      .useModule(InMemorySectionsPersistenceModule)
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
    sections.items.clear();
  });

  describe('POST /api/v1/secciones', () => {
    it('el personal agrega un servicio, publicado por defecto', async () => {
      const response = await create(staffToken, {
        tipo: 'servicio',
        titulo: 'Visitas guiadas',
        descripcion: 'Recorridos para grupos.',
      }).expect(201);

      expect(response.body).toMatchObject({
        tipo: 'servicio',
        titulo: 'Visitas guiadas',
        orden: 0,
        publicado: true,
      });
    });

    it('el administrador también puede', async () => {
      await create(adminToken, {
        tipo: 'horario',
        titulo: 'Sábados',
        descripcion: '9 a 1',
      }).expect(201);
    });

    it('un usuario público no puede (403)', async () => {
      const response = await create(publicToken, {
        tipo: 'servicio',
        titulo: 'x',
        descripcion: 'x',
      }).expect(403);

      expect(response.body.codigo).toBe('ACCESO_DENEGADO');
    });

    it('sin sesión responde 401', async () => {
      await http
        .post('/api/v1/secciones')
        .send({ tipo: 'servicio', titulo: 'x', descripcion: 'x' })
        .expect(401);
    });

    it('valida los campos y responde con el detalle', async () => {
      const response = await create(staffToken, {
        tipo: 'otro',
        titulo: '',
        orden: -1,
      }).expect(400);

      expect(JSON.stringify(response.body)).toContain(
        'El tipo debe ser uno de',
      );
    });

    it('un título de solo espacios lo rechaza el dominio (422)', async () => {
      const response = await create(staffToken, {
        tipo: 'servicio',
        titulo: '   ',
        descripcion: 'x',
      }).expect(422);

      expect(response.body.codigo).toBe('TITULO_REQUERIDO');
    });
  });

  describe('GET /api/v1/secciones (landing)', () => {
    beforeEach(async () => {
      await create(staffToken, {
        tipo: 'servicio',
        titulo: 'B',
        descripcion: 'x',
        orden: 2,
      });
      await create(staffToken, {
        tipo: 'servicio',
        titulo: 'A',
        descripcion: 'x',
        orden: 1,
      });
      await create(staffToken, {
        tipo: 'servicio',
        titulo: 'Oculto',
        descripcion: 'x',
        publicado: false,
      });
      await create(staffToken, {
        tipo: 'espacio',
        titulo: 'Museo',
        descripcion: 'x',
      });
      await create(staffToken, {
        tipo: 'horario',
        titulo: 'Sábados',
        descripcion: 'x',
      });
    });

    it('sin sesión muestra solo lo publicado, en el orden de la landing', async () => {
      const response = await http.get('/api/v1/secciones').expect(200);

      expect(
        response.body.datos.map((item: { titulo: string }) => item.titulo),
      ).toEqual(['Museo', 'A', 'B', 'Sábados']);
      expect(response.body.total).toBe(4);
    });

    it('filtra por tipo y pagina', async () => {
      const response = await http
        .get('/api/v1/secciones?tipo=servicio&pagina=2&porPagina=1')
        .expect(200);

      expect(response.body).toMatchObject({
        pagina: 2,
        porPagina: 1,
        total: 2,
        totalPaginas: 2,
      });
      expect(response.body.datos[0].titulo).toBe('B');
    });

    it('rechaza un tipo que no existe', async () => {
      await http.get('/api/v1/secciones?tipo=otro').expect(400);
    });
  });

  describe('GET /api/v1/secciones/gestion (panel)', () => {
    it('el personal ve también lo que no está publicado', async () => {
      await create(staffToken, {
        tipo: 'servicio',
        titulo: 'Oculto',
        descripcion: 'x',
        publicado: false,
      });

      const response = await http
        .get('/api/v1/secciones/gestion')
        .set(auth(staffToken))
        .expect(200);

      expect(response.body.datos[0]).toMatchObject({
        titulo: 'Oculto',
        publicado: false,
      });
    });

    it('un usuario público no puede entrar (403)', async () => {
      await http
        .get('/api/v1/secciones/gestion')
        .set(auth(publicToken))
        .expect(403);
    });
  });

  describe('PATCH y DELETE /api/v1/secciones/:id', () => {
    it('el personal edita solo los campos enviados', async () => {
      const { body } = await create(staffToken, {
        tipo: 'horario',
        titulo: 'Lunes',
        descripcion: '8 a 5',
      });

      const response = await http
        .patch(`/api/v1/secciones/${body.id}`)
        .set(auth(staffToken))
        .send({ descripcion: '8 a 6', publicado: false })
        .expect(200);

      expect(response.body).toMatchObject({
        titulo: 'Lunes',
        descripcion: '8 a 6',
        publicado: false,
      });
    });

    it('no deja cambiar el tipo', async () => {
      const { body } = await create(staffToken, {
        tipo: 'horario',
        titulo: 'Lunes',
        descripcion: '8 a 5',
      });

      await http
        .patch(`/api/v1/secciones/${body.id}`)
        .set(auth(staffToken))
        .send({ tipo: 'servicio' })
        .expect(400);
    });

    it('elimina y después ya no existe', async () => {
      const { body } = await create(staffToken, {
        tipo: 'espacio',
        titulo: 'Café',
        descripcion: 'x',
      });

      await http
        .delete(`/api/v1/secciones/${body.id}`)
        .set(auth(staffToken))
        .expect(204);
      await http
        .delete(`/api/v1/secciones/${body.id}`)
        .set(auth(staffToken))
        .expect(404);
    });

    it('un id que no es UUID responde 404', async () => {
      await http
        .patch('/api/v1/secciones/abc')
        .set(auth(staffToken))
        .send({ titulo: 'x' })
        .expect(404);
    });

    it('un usuario público no puede editar ni eliminar (403)', async () => {
      const { body } = await create(staffToken, {
        tipo: 'espacio',
        titulo: 'Café',
        descripcion: 'x',
      });

      await http
        .patch(`/api/v1/secciones/${body.id}`)
        .set(auth(publicToken))
        .send({ titulo: 'x' })
        .expect(403);
      await http
        .delete(`/api/v1/secciones/${body.id}`)
        .set(auth(publicToken))
        .expect(403);
    });
  });
});
