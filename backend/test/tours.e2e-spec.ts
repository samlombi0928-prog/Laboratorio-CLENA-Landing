import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { FILE_STORAGE } from '../src/application/storage/ports/file-storage.js';
import { MAX_COVER_BYTES } from '../src/application/tours/create-tour.use-case.js';
import { TOUR_REPOSITORY } from '../src/application/tours/ports/tour-repository.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { StorageModule } from '../src/modules/storage.module.js';
import { ToursPersistenceModule } from '../src/modules/tours-persistence.module.js';
import { ToursModule } from '../src/modules/tours.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemoryFileStorage } from './support/in-memory-file-storage.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryTourRepository } from './support/in-memory-tour-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

@Module({
  providers: [
    { provide: USER_REPOSITORY, useValue: new InMemoryUserRepository() },
    { provide: SESSION_REPOSITORY, useValue: new InMemorySessionRepository() },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY],
})
class InMemoryAuthPersistenceModule {}

@Module({
  providers: [
    { provide: TOUR_REPOSITORY, useValue: new InMemoryTourRepository() },
  ],
  exports: [TOUR_REPOSITORY],
})
class InMemoryToursPersistenceModule {}

const storage = new InMemoryFileStorage();

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

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);

describe('Recorridos (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let anaToken: string;
  let beaToken: string;

  async function sessionFor(nombre: string, correo: string): Promise<string> {
    const credentials = { correo, contrasena: 'secreta123' };
    await http
      .post('/api/v1/auth/registro')
      .send({ nombre, ...credentials, aceptaPrivacidad: true })
      .expect(201);
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
        ToursModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .overrideModule(ToursPersistenceModule)
      .useModule(InMemoryToursPersistenceModule)
      .overrideModule(StorageModule)
      .useModule(InMemoryStorageModule)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    anaToken = await sessionFor('Ana Pérez', 'ana@correo.com');
    beaToken = await sessionFor('Bea Gómez', 'bea@correo.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/recorridos', () => {
    it('sin sesión responde 401', async () => {
      await http
        .post('/api/v1/recorridos')
        .field('titulo', 'Sin sesión')
        .expect(401);
    });

    it('crea un borrador sin portada', async () => {
      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${anaToken}`)
        .field('titulo', '  Primer recorrido  ')
        .field('descripcion', 'Sin portada')
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        titulo: 'Primer recorrido',
        descripcion: 'Sin portada',
        estado: 'draft',
        portadaUrl: null,
        creadoEn: expect.any(String),
        actualizadoEn: expect.any(String),
      });
    });

    it('crea un borrador con portada PNG', async () => {
      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${anaToken}`)
        .field('titulo', 'Con portada')
        .attach('portada', PNG, 'portada.png')
        .expect(201);

      expect(res.body.portadaUrl).toMatch(/^\/archivos\/covers\/.+\.png$/);
      expect(storage.files.size).toBe(1);
    });

    it('rechaza un archivo que no es imagen aunque se llame .png', async () => {
      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${anaToken}`)
        .field('titulo', 'Falsa')
        .attach('portada', Buffer.from('<svg></svg>'), {
          filename: 'falsa.png',
          contentType: 'image/png',
        })
        .expect(422);

      expect(res.body.codigo).toBe('TIPO_DE_IMAGEN_NO_VALIDO');
      expect(storage.files.size).toBe(1);
    });

    it('rechaza una portada de más de 5 MB con un mensaje en español', async () => {
      const big = Buffer.alloc(MAX_COVER_BYTES + 1);
      PNG.copy(big);

      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${anaToken}`)
        .field('titulo', 'Grande')
        .attach('portada', big, 'grande.png')
        .expect(413);

      expect(res.body).toMatchObject({
        codigo: 'ARCHIVO_DEMASIADO_GRANDE',
        mensaje: 'El archivo supera el tamaño máximo permitido',
      });
    });

    it('responde 400 con mensajes en español si falta el título o sobra un campo', async () => {
      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${anaToken}`)
        .field('descripcion', 'Sin título')
        .field('estado', 'published')
        .expect(400);

      expect(res.body.codigo).toBe('VALIDACION');
      expect(res.body.detalles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            campo: 'titulo',
            errores: expect.arrayContaining(['El título es obligatorio']),
          }),
          expect.objectContaining({ campo: 'estado' }),
        ]),
      );
    });

    it('también acepta JSON cuando no hay portada', async () => {
      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${beaToken}`)
        .send({ titulo: 'Recorrido de Bea' })
        .expect(201);

      expect(res.body).toMatchObject({
        titulo: 'Recorrido de Bea',
        descripcion: '',
        estado: 'draft',
      });
    });

    it('acepta "portada" vacía como texto, como la envía Swagger sin archivo', async () => {
      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${beaToken}`)
        .field('titulo', 'Desde Swagger')
        .field('portada', '')
        .expect(201);

      expect(res.body.portadaUrl).toBeNull();
    });

    it('rechaza "portada" como texto con contenido', async () => {
      const res = await http
        .post('/api/v1/recorridos')
        .set('Authorization', `Bearer ${beaToken}`)
        .field('titulo', 'Portada falsa')
        .field('portada', 'https://otro-sitio.com/imagen.png')
        .expect(400);

      expect(res.body.detalles).toEqual([
        {
          campo: 'portada',
          errores: ['La portada debe enviarse como archivo'],
        },
      ]);
    });
  });

  describe('GET /api/v1/recorridos/mios', () => {
    it('devuelve solo los recorridos del usuario, el más reciente primero', async () => {
      const res = await http
        .get('/api/v1/recorridos/mios')
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(200);

      expect(res.body.datos.map((t: { titulo: string }) => t.titulo)).toEqual([
        'Con portada',
        'Primer recorrido',
      ]);
      expect(res.body).toMatchObject({
        pagina: 1,
        porPagina: 12,
        total: 2,
        totalPaginas: 1,
      });
    });

    it('pagina con pagina y porPagina', async () => {
      const res = await http
        .get('/api/v1/recorridos/mios?pagina=2&porPagina=1')
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(200);

      expect(res.body.datos.map((t: { titulo: string }) => t.titulo)).toEqual([
        'Primer recorrido',
      ]);
      expect(res.body.totalPaginas).toBe(2);
    });

    it('sin sesión responde 401', async () => {
      await http.get('/api/v1/recorridos/mios').expect(401);
    });
  });

  describe('GET /api/v1/recorridos/:id', () => {
    let draftId: string;

    beforeAll(async () => {
      const mine = await http
        .get('/api/v1/recorridos/mios')
        .set('Authorization', `Bearer ${anaToken}`);
      draftId = mine.body.datos[0].id as string;
    });

    it('el creador ve su borrador', async () => {
      const res = await http
        .get(`/api/v1/recorridos/${draftId}`)
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: draftId, titulo: 'Con portada' });
    });

    it('otro usuario o alguien sin sesión reciben 404', async () => {
      await http
        .get(`/api/v1/recorridos/${draftId}`)
        .set('Authorization', `Bearer ${beaToken}`)
        .expect(404);
      const res = await http.get(`/api/v1/recorridos/${draftId}`).expect(404);

      expect(res.body.codigo).toBe('RECURSO_NO_ENCONTRADO');
    });

    it('con un token vencido o inválido responde 401, para que el cliente renueve la sesión', async () => {
      const res = await http
        .get(`/api/v1/recorridos/${draftId}`)
        .set('Authorization', 'Bearer no-es-un-token')
        .expect(401);

      expect(res.body.codigo).toBe('TOKEN_INVALIDO');
    });

    it('un id que no existe o que no es un UUID responde 404', async () => {
      await http
        .get('/api/v1/recorridos/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(404);
      await http
        .get('/api/v1/recorridos/no-es-un-id')
        .set('Authorization', `Bearer ${anaToken}`)
        .expect(404);
    });
  });
});
