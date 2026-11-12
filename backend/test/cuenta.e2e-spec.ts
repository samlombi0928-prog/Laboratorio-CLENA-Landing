import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { FILE_STORAGE } from '../src/application/storage/ports/file-storage.js';
import { ACCOUNT_ERASER } from '../src/application/users/ports/account-eraser.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { Role } from '../src/domain/users/role.js';
import { User } from '../src/domain/users/user.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AccountPersistenceModule } from '../src/modules/account-persistence.module.js';
import { AccountModule } from '../src/modules/account.module.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { StorageModule } from '../src/modules/storage.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemoryAccountEraser } from './support/in-memory-account-eraser.js';
import { InMemoryFileStorage } from './support/in-memory-file-storage.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const users = new InMemoryUserRepository();
const sessions = new InMemorySessionRepository();
const storage = new InMemoryFileStorage();
const eraser = new InMemoryAccountEraser(users, sessions);

@Module({
  providers: [
    { provide: USER_REPOSITORY, useValue: users },
    { provide: SESSION_REPOSITORY, useValue: sessions },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY],
})
class InMemoryAuthPersistenceModule {}

@Module({
  providers: [{ provide: ACCOUNT_ERASER, useValue: eraser }],
  exports: [ACCOUNT_ERASER],
})
class InMemoryAccountPersistenceModule {}

@Module({
  providers: [{ provide: FILE_STORAGE, useValue: storage }],
  exports: [FILE_STORAGE],
})
class InMemoryStorageModule {}

const testEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'no-se-usa',
  DB_PASSWORD: 'no-se-usa',
  DB_NAME: 'no-se-usa',
  JWT_ACCESS_SECRET: 'secreto-de-prueba-e2e-con-mas-de-32-caracteres',
};

const PASSWORD = 'secreta123';

describe('Eliminar mi cuenta (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let counter = 0;

  async function register(role = Role.Public) {
    const correo = `persona${++counter}@correo.com`;
    const res = await http
      .post('/api/v1/auth/registro')
      .send({
        nombre: `Persona ${counter}`,
        correo,
        contrasena: PASSWORD,
        aceptaPrivacidad: true,
      })
      .expect(201);
    const id = res.body.id as string;
    if (role !== Role.Public) {
      const user = (await users.findById(id))!;
      users.users.set(
        id,
        User.restore({
          id,
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
    return { id, correo };
  }

  function login(correo: string, contrasena = PASSWORD) {
    return http.post('/api/v1/auth/login').send({ correo, contrasena });
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
        AccountModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .overrideModule(AccountPersistenceModule)
      .useModule(InMemoryAccountPersistenceModule)
      .overrideModule(StorageModule)
      .useModule(InMemoryStorageModule)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('con la contraseña correcta elimina la cuenta, sus datos y su sesión', async () => {
    const { id, correo } = await register();
    const session = await login(correo).expect(200);
    const token = session.body.tokenAcceso as string;
    const cover = await storage.save({
      content: new Uint8Array([1]),
      contentType: 'image/jpeg',
      folder: 'covers',
    });
    eraser.filesByUser.set(id, [cover.key]);
    eraser.registeredEmails.add(correo);

    const res = await http
      .delete('/api/v1/cuenta')
      .set('Authorization', `Bearer ${token}`)
      .send({ contrasena: PASSWORD })
      .expect(204);

    // La cookie de la sesión se borra del navegador.
    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    expect(cookies.find((c) => c.startsWith('refresh_token='))).toMatch(
      /Expires=Thu, 01 Jan 1970/,
    );
    // Se fue la cuenta, su inscripción y su portada.
    expect(await users.findById(id)).toBeNull();
    expect(eraser.registeredEmails.has(correo)).toBe(false);
    expect(storage.files.has(cover.key)).toBe(false);
  });

  it('después de eliminarla, el sistema ya no reconoce la cuenta al iniciar sesión', async () => {
    const { correo } = await register();
    const session = await login(correo).expect(200);

    await http
      .delete('/api/v1/cuenta')
      .set('Authorization', `Bearer ${session.body.tokenAcceso as string}`)
      .send({ contrasena: PASSWORD })
      .expect(204);

    const again = await login(correo).expect(401);
    expect(again.body.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  it('la sesión de la cuenta eliminada no se puede renovar', async () => {
    const { correo } = await register();
    const session = await login(correo).expect(200);
    const cookie = ([] as string[])
      .concat(session.headers['set-cookie'] ?? [])
      .find((c) => c.startsWith('refresh_token='))!
      .split(';')[0];

    await http
      .delete('/api/v1/cuenta')
      .set('Authorization', `Bearer ${session.body.tokenAcceso as string}`)
      .send({ contrasena: PASSWORD })
      .expect(204);

    await http.post('/api/v1/auth/renovar').set('Cookie', cookie).expect(401);
  });

  it('con una contraseña incorrecta responde 422 y la cuenta sigue funcionando', async () => {
    const { id, correo } = await register();
    const session = await login(correo).expect(200);

    const res = await http
      .delete('/api/v1/cuenta')
      .set('Authorization', `Bearer ${session.body.tokenAcceso as string}`)
      .send({ contrasena: 'otra-clave-distinta' })
      .expect(422);

    expect(res.body.codigo).toBe('CONTRASENA_INCORRECTA');
    expect(await users.findById(id)).not.toBeNull();
    await login(correo).expect(200);
  });

  it('sin contraseña en la petición responde un error de validación', async () => {
    const { correo } = await register();
    const session = await login(correo).expect(200);

    await http
      .delete('/api/v1/cuenta')
      .set('Authorization', `Bearer ${session.body.tokenAcceso as string}`)
      .send({})
      .expect(400);
  });

  it('sin iniciar sesión responde 401', async () => {
    await http
      .delete('/api/v1/cuenta')
      .send({ contrasena: PASSWORD })
      .expect(401);
  });

  it('la única cuenta de administrador no se puede eliminar', async () => {
    const admin = await register(Role.Admin);
    const session = await login(admin.correo).expect(200);

    const res = await http
      .delete('/api/v1/cuenta')
      .set('Authorization', `Bearer ${session.body.tokenAcceso as string}`)
      .send({ contrasena: PASSWORD })
      .expect(422);

    expect(res.body.codigo).toBe('ULTIMO_ADMINISTRADOR');
    expect(await users.findById(admin.id)).not.toBeNull();
  });

  it('el personal del CLENA sí puede eliminar su cuenta', async () => {
    const staff = await register(Role.Staff);
    const session = await login(staff.correo).expect(200);

    await http
      .delete('/api/v1/cuenta')
      .set('Authorization', `Bearer ${session.body.tokenAcceso as string}`)
      .send({ contrasena: PASSWORD })
      .expect(204);

    expect(await users.findById(staff.id)).toBeNull();
  });

  it('limita los intentos: tras muchas contraseñas incorrectas responde 429', async () => {
    const { correo } = await register();
    const session = await login(correo).expect(200);
    const token = session.body.tokenAcceso as string;

    let last = 0;
    for (let i = 0; i < 12; i++) {
      const res = await http
        .delete('/api/v1/cuenta')
        .set('Authorization', `Bearer ${token}`)
        .send({ contrasena: 'incorrecta-incorrecta' });
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
