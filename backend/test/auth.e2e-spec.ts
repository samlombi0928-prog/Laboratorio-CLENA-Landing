import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

@Module({
  providers: [
    { provide: USER_REPOSITORY, useValue: new InMemoryUserRepository() },
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

const ana = {
  nombre: 'Ana Pérez',
  correo: 'ana@correo.com',
  contrasena: 'secreta123',
  aceptaPrivacidad: true,
};

function refreshCookie(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const cookie = cookies.find((c) => c.startsWith('refresh_token='));
  if (!cookie) throw new Error('La respuesta no trae la cookie refresh_token');
  return cookie;
}

describe('Autenticación (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: () => validateEnvironment(testEnvironment),
        }),
        AuthModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/registro', () => {
    it('crea un creador y no devuelve la contraseña', async () => {
      const res = await http
        .post('/api/v1/auth/registro')
        .send(ana)
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        nombre: 'Ana Pérez',
        correo: 'ana@correo.com',
        rol: 'creator',
      });
    });

    it('responde 409 si el correo ya está registrado', async () => {
      const res = await http
        .post('/api/v1/auth/registro')
        .send({ ...ana, correo: 'ANA@correo.com' })
        .expect(409);

      expect(res.body.codigo).toBe('CORREO_YA_REGISTRADO');
    });

    it('responde 422 si no acepta el aviso de privacidad', async () => {
      const res = await http
        .post('/api/v1/auth/registro')
        .send({ ...ana, correo: 'otra@correo.com', aceptaPrivacidad: false })
        .expect(422);

      expect(res.body.codigo).toBe('CONSENTIMIENTO_REQUERIDO');
    });

    it('responde 400 con mensajes en español por cada campo inválido', async () => {
      const res = await http
        .post('/api/v1/auth/registro')
        .send({ nombre: '', correo: 'no-es-correo', contrasena: 'corta' })
        .expect(400);

      expect(res.body.codigo).toBe('VALIDACION');
      expect(res.body.detalles).toEqual(
        expect.arrayContaining([
          { campo: 'nombre', errores: ['El nombre es obligatorio'] },
          { campo: 'correo', errores: ['El correo no es válido'] },
          {
            campo: 'contrasena',
            errores: ['La contraseña debe tener al menos 8 caracteres'],
          },
          {
            campo: 'aceptaPrivacidad',
            errores: ['Debe indicar si acepta el aviso de privacidad'],
          },
        ]),
      );
    });
  });

  describe('sesión completa', () => {
    let accessToken: string;
    let cookie: string;

    it('POST /login entrega el access token y la cookie httpOnly', async () => {
      const res = await http
        .post('/api/v1/auth/login')
        .send({ correo: 'Ana@Correo.com', contrasena: 'secreta123' })
        .expect(200);

      expect(res.body).toMatchObject({
        tokenAcceso: expect.any(String),
        expiraEn: 900,
        usuario: { correo: 'ana@correo.com', rol: 'creator' },
      });
      expect(res.body).not.toHaveProperty('refreshToken');

      cookie = refreshCookie(res);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Strict/i);
      expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
      accessToken = res.body.tokenAcceso;
    });

    it('GET /perfil responde con el usuario de la sesión', async () => {
      const res = await http
        .get('/api/v1/auth/perfil')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        nombre: 'Ana Pérez',
        correo: 'ana@correo.com',
      });
    });

    it('POST /renovar rota la cookie y el access token', async () => {
      const res = await http
        .post('/api/v1/auth/renovar')
        .set('Cookie', cookie.split(';')[0])
        .expect(200);

      const newCookie = refreshCookie(res);
      expect(newCookie.split(';')[0]).not.toBe(cookie.split(';')[0]);
      expect(res.body.tokenAcceso).toEqual(expect.any(String));

      // El refresh token anterior ya no sirve.
      await http
        .post('/api/v1/auth/renovar')
        .set('Cookie', cookie.split(';')[0])
        .expect(401);
      cookie = newCookie;
    });

    it('al reutilizar un token viejo se cerraron todas las sesiones', async () => {
      const res = await http
        .post('/api/v1/auth/renovar')
        .set('Cookie', cookie.split(';')[0])
        .expect(401);

      expect(res.body.codigo).toBe('SESION_INVALIDA');
    });

    it('POST /logout cierra la sesión y borra la cookie', async () => {
      const login = await http
        .post('/api/v1/auth/login')
        .send({ correo: 'ana@correo.com', contrasena: 'secreta123' })
        .expect(200);
      const current = refreshCookie(login).split(';')[0];

      const res = await http
        .post('/api/v1/auth/logout')
        .set('Cookie', current)
        .expect(204);

      expect(refreshCookie(res)).toMatch(/refresh_token=;/);
      await http
        .post('/api/v1/auth/renovar')
        .set('Cookie', current)
        .expect(401);
    });
  });

  describe('rutas protegidas', () => {
    it('GET /perfil sin token responde 401', async () => {
      const res = await http.get('/api/v1/auth/perfil').expect(401);

      expect(res.body.codigo).toBe('NO_AUTENTICADO');
    });

    it('GET /perfil con un token inválido responde 401', async () => {
      const res = await http
        .get('/api/v1/auth/perfil')
        .set('Authorization', 'Bearer no-es-un-token')
        .expect(401);

      expect(res.body.codigo).toBe('TOKEN_INVALIDO');
    });

    it('POST /renovar sin cookie responde 401', async () => {
      await http.post('/api/v1/auth/renovar').expect(401);
    });
  });

  it('POST /login con credenciales incorrectas responde 401 y luego limita los intentos', async () => {
    const res = await http
      .post('/api/v1/auth/login')
      .send({ correo: 'ana@correo.com', contrasena: 'equivocada' })
      .expect(401);
    expect(res.body.codigo).toBe('CREDENCIALES_INVALIDAS');

    let status = 0;
    for (let i = 0; i < 12 && status !== 429; i++) {
      status = (
        await http
          .post('/api/v1/auth/login')
          .send({ correo: 'ana@correo.com', contrasena: 'equivocada' })
      ).status;
    }
    expect(status).toBe(429);
  });
});
