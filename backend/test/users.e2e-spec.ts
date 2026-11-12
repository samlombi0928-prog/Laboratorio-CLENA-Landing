import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { Role } from '../src/domain/users/role.js';
import { User } from '../src/domain/users/user.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { UsersModule } from '../src/modules/users.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const users = new InMemoryUserRepository();

@Module({
  providers: [
    { provide: USER_REPOSITORY, useValue: users },
    { provide: SESSION_REPOSITORY, useValue: new InMemorySessionRepository() },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY],
})
class InMemoryAuthPersistenceModule {}

const testEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'no-se-usa',
  DB_PASSWORD: 'no-se-usa',
  DB_NAME: 'no-se-usa',
  JWT_ACCESS_SECRET: 'secreto-de-prueba-e2e-con-mas-de-32-caracteres',
};

describe('Gestión de roles (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  const ids: Record<string, string> = {};
  const tokens: Record<string, string> = {};

  async function register(nombre: string, correo: string, role?: Role) {
    const res = await http
      .post('/api/v1/auth/registro')
      .send({
        nombre,
        correo,
        contrasena: 'secreta123',
        aceptaPrivacidad: true,
      })
      .expect(201);
    ids[correo] = res.body.id as string;
    if (role) {
      const user = (await users.findById(res.body.id as string))!;
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
  }

  async function login(correo: string): Promise<request.Response> {
    return http
      .post('/api/v1/auth/login')
      .send({ correo, contrasena: 'secreta123' })
      .expect(200);
  }

  async function token(correo: string): Promise<string> {
    return (await login(correo)).body.tokenAcceso as string;
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
        UsersModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    await register('Admin CLENA', 'admin@clena.org', Role.Admin);
    await register('Ana Pérez', 'ana@correo.com');
    await register('Bea Gómez', 'bea@correo.com', Role.Staff);
    await register('Carlos Ruiz', 'carlos@correo.com');
    for (const correo of Object.keys(ids)) {
      tokens[correo] = await token(correo);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/usuarios', () => {
    it('el administrador ve los usuarios por nombre, paginados', async () => {
      const res = await http
        .get('/api/v1/usuarios?pagina=1&porPagina=2')
        .set('Authorization', `Bearer ${tokens['admin@clena.org']}`)
        .expect(200);

      expect(res.body).toMatchObject({
        pagina: 1,
        porPagina: 2,
        total: 4,
        totalPaginas: 2,
      });
      expect(res.body.datos).toEqual([
        {
          id: ids['admin@clena.org'],
          nombre: 'Admin CLENA',
          correo: 'admin@clena.org',
          rol: 'admin',
        },
        {
          id: ids['ana@correo.com'],
          nombre: 'Ana Pérez',
          correo: 'ana@correo.com',
          rol: 'public',
        },
      ]);
    });

    it('filtra por rol y busca por nombre o correo', async () => {
      const auth = `Bearer ${tokens['admin@clena.org']}`;
      const staff = await http
        .get('/api/v1/usuarios?rol=staff')
        .set('Authorization', auth)
        .expect(200);
      const carlos = await http
        .get('/api/v1/usuarios?buscar=CARLOS')
        .set('Authorization', auth)
        .expect(200);

      expect(staff.body.datos.map((u: { correo: string }) => u.correo)).toEqual(
        ['bea@correo.com'],
      );
      expect(carlos.body.total).toBe(1);
    });

    it('el personal y los usuarios públicos reciben 403, sin sesión 401', async () => {
      await http
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokens['bea@correo.com']}`)
        .expect(403);
      await http
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokens['ana@correo.com']}`)
        .expect(403);
      await http.get('/api/v1/usuarios').expect(401);
    });
  });

  describe('PATCH /api/v1/usuarios/:id/rol', () => {
    it('el administrador nombra personal y el usuario lo ve al volver a entrar', async () => {
      const res = await http
        .patch(`/api/v1/usuarios/${ids['ana@correo.com']}/rol`)
        .set('Authorization', `Bearer ${tokens['admin@clena.org']}`)
        .send({ rol: 'staff' })
        .expect(200);

      expect(res.body).toMatchObject({
        correo: 'ana@correo.com',
        rol: 'staff',
      });
      expect((await login('ana@correo.com')).body.usuario.rol).toBe('staff');
    });

    it('el administrador retira a alguien del personal', async () => {
      await http
        .patch(`/api/v1/usuarios/${ids['bea@correo.com']}/rol`)
        .set('Authorization', `Bearer ${tokens['admin@clena.org']}`)
        .send({ rol: 'public' })
        .expect(200);

      expect((await login('bea@correo.com')).body.usuario.rol).toBe('public');
    });

    it('no deja dar el rol de administrador ni cambiárselo a un administrador', async () => {
      const auth = `Bearer ${tokens['admin@clena.org']}`;
      const asAdmin = await http
        .patch(`/api/v1/usuarios/${ids['carlos@correo.com']}/rol`)
        .set('Authorization', auth)
        .send({ rol: 'admin' })
        .expect(400);
      const ofAdmin = await http
        .patch(`/api/v1/usuarios/${ids['admin@clena.org']}/rol`)
        .set('Authorization', auth)
        .send({ rol: 'public' })
        .expect(422);

      expect(asAdmin.body.detalles).toEqual([
        { campo: 'rol', errores: ['El rol debe ser uno de: staff, public'] },
      ]);
      expect(ofAdmin.body.codigo).toBe('ROL_DE_ADMINISTRADOR');
    });

    it('el personal y los usuarios públicos no pueden cambiar roles', async () => {
      const url = `/api/v1/usuarios/${ids['carlos@correo.com']}/rol`;
      await http
        .patch(url)
        .set('Authorization', `Bearer ${tokens['ana@correo.com']}`)
        .send({ rol: 'staff' })
        .expect(403);
      await http
        .patch(url)
        .set('Authorization', `Bearer ${tokens['carlos@correo.com']}`)
        .send({ rol: 'staff' })
        .expect(403);
    });

    it('un usuario que no existe o un id que no es UUID responde 404', async () => {
      const auth = `Bearer ${tokens['admin@clena.org']}`;
      await http
        .patch('/api/v1/usuarios/00000000-0000-4000-8000-000000000000/rol')
        .set('Authorization', auth)
        .send({ rol: 'staff' })
        .expect(404);
      await http
        .patch('/api/v1/usuarios/no-es-un-id/rol')
        .set('Authorization', auth)
        .send({ rol: 'staff' })
        .expect(404);
    });
  });
});
