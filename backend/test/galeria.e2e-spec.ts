import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { SESSION_REPOSITORY } from '../src/application/auth/ports/session-repository.js';
import { GALLERY_IMAGE_REPOSITORY } from '../src/application/gallery/ports/gallery-image-repository.js';
import { MAX_GALLERY_IMAGE_BYTES } from '../src/application/gallery/upload-gallery-image.use-case.js';
import { FILE_STORAGE } from '../src/application/storage/ports/file-storage.js';
import { USER_REPOSITORY } from '../src/application/users/ports/user-repository.js';
import { Role } from '../src/domain/users/role.js';
import { User } from '../src/domain/users/user.js';
import { validateEnvironment } from '../src/infrastructure/config/environment-variables.js';
import { AuthPersistenceModule } from '../src/modules/auth-persistence.module.js';
import { AuthModule } from '../src/modules/auth.module.js';
import { GalleryPersistenceModule } from '../src/modules/gallery-persistence.module.js';
import { GalleryModule } from '../src/modules/gallery.module.js';
import { StorageModule } from '../src/modules/storage.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';
import { InMemoryFileStorage } from './support/in-memory-file-storage.js';
import { InMemoryGalleryImageRepository } from './support/in-memory-gallery-image-repository.js';
import { InMemorySessionRepository } from './support/in-memory-session-repository.js';
import { InMemoryUserRepository } from './support/in-memory-user-repository.js';

const users = new InMemoryUserRepository();
const storage = new InMemoryFileStorage();

@Module({
  providers: [
    { provide: USER_REPOSITORY, useValue: users },
    { provide: SESSION_REPOSITORY, useValue: new InMemorySessionRepository() },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY],
})
class InMemoryAuthPersistenceModule {}

@Module({
  providers: [
    {
      provide: GALLERY_IMAGE_REPOSITORY,
      useValue: new InMemoryGalleryImageRepository(),
    },
  ],
  exports: [GALLERY_IMAGE_REPOSITORY],
})
class InMemoryGalleryPersistenceModule {}

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
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Galería (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let staffToken: string;
  let adminToken: string;
  let publicToken: string;

  /**
   * Registra una cuenta (siempre nace como usuario público) y, si se pide otro
   * rol, la ascendemos directo en el repositorio en memoria: ningún endpoint
   * permite cambiar roles todavía.
   */
  async function sessionFor(
    nombre: string,
    correo: string,
    role: Role = Role.Public,
  ): Promise<string> {
    const credentials = { correo, contrasena: 'secreta123' };
    await http
      .post('/api/v1/auth/registro')
      .send({ nombre, ...credentials, aceptaPrivacidad: true })
      .expect(201);
    if (role !== Role.Public) {
      const user = await users.findByEmail(correo);
      users.users.set(
        user!.id,
        User.restore({
          id: user!.id,
          name: user!.name,
          email: user!.email,
          passwordHash: user!.passwordHash,
          role,
          privacyConsentAt: user!.privacyConsentAt,
          privacyNoticeVersion: user!.privacyNoticeVersion,
          createdAt: user!.createdAt,
        }),
      );
    }
    const login = await http
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);
    return login.body.tokenAcceso as string;
  }

  function upload(
    token: string,
    titulo: string,
    file: Buffer | null = PNG,
    filename = 'foto.png',
  ) {
    const req = http
      .post('/api/v1/galeria')
      .set('Authorization', `Bearer ${token}`)
      .field('titulo', titulo)
      .field('textoAlternativo', `Texto de ${titulo}`);
    return file ? req.attach('imagen', file, filename) : req;
  }

  /** Clave del archivo a partir de la URL que devuelve la API. */
  const keyOf = (imagenUrl: string) => imagenUrl.replace('/archivos/', '');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: () => validateEnvironment(testEnvironment),
        }),
        AuthModule,
        GalleryModule,
      ],
    })
      .overrideModule(AuthPersistenceModule)
      .useModule(InMemoryAuthPersistenceModule)
      .overrideModule(GalleryPersistenceModule)
      .useModule(InMemoryGalleryPersistenceModule)
      .overrideModule(StorageModule)
      .useModule(InMemoryStorageModule)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    publicToken = await sessionFor('Pablo Público', 'pablo@correo.com');
    staffToken = await sessionFor('Sara Staff', 'sara@clena.co', Role.Staff);
    adminToken = await sessionFor('Adán Admin', 'adan@clena.co', Role.Admin);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/galeria con la galería vacía', () => {
    it('es pública y devuelve una página vacía', async () => {
      const res = await http.get('/api/v1/galeria').expect(200);

      expect(res.body).toEqual({
        datos: [],
        pagina: 1,
        porPagina: 12,
        total: 0,
        totalPaginas: 0,
      });
    });
  });

  describe('POST /api/v1/galeria', () => {
    it('sin sesión responde 401', async () => {
      await http
        .post('/api/v1/galeria')
        .field('titulo', 'Sin sesión')
        .field('textoAlternativo', 'Sin sesión')
        .attach('imagen', PNG, 'foto.png')
        .expect(401);
    });

    it('un usuario público no puede subir: responde 403', async () => {
      const res = await upload(publicToken, 'Intruso').expect(403);

      expect(res.body.codigo).toBe('ACCESO_DENEGADO');
      expect(storage.files.size).toBe(0);
    });

    it('el personal del CLENA sube una imagen PNG y aparece en la respuesta', async () => {
      const res = await upload(staffToken, 'Fachada de la Aduana').expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        titulo: 'Fachada de la Aduana',
        textoAlternativo: 'Texto de Fachada de la Aduana',
        imagenUrl: expect.stringMatching(/^\/archivos\/gallery\/.+\.png$/),
        creadoEn: expect.any(String),
      });
      expect(storage.files.has(keyOf(res.body.imagenUrl))).toBe(true);
    });

    it('el administrador también puede subir, y una imagen JPG queda como .jpg', async () => {
      const res = await upload(
        adminToken,
        'Patio interior',
        JPG,
        'patio.jpg',
      ).expect(201);

      expect(res.body.imagenUrl).toMatch(/^\/archivos\/gallery\/.+\.jpg$/);
    });

    it('rechaza un archivo que no es imagen aunque se llame .png, y dice por qué', async () => {
      const filesBefore = storage.files.size;

      const res = await http
        .post('/api/v1/galeria')
        .set('Authorization', `Bearer ${staffToken}`)
        .field('titulo', 'Falsa')
        .field('textoAlternativo', 'Falsa')
        .attach('imagen', Buffer.from('<svg></svg>'), {
          filename: 'falsa.png',
          contentType: 'image/png',
        })
        .expect(422);

      expect(res.body).toMatchObject({
        codigo: 'TIPO_DE_IMAGEN_NO_VALIDO',
        mensaje: 'La imagen debe ser un archivo JPG o PNG',
      });
      expect(storage.files.size).toBe(filesBefore);
    });

    it('rechaza una imagen de más de 10 MB con un mensaje en español', async () => {
      const filesBefore = storage.files.size;
      const big = Buffer.alloc(MAX_GALLERY_IMAGE_BYTES + 1);
      PNG.copy(big);

      const res = await upload(staffToken, 'Enorme', big, 'enorme.png').expect(
        413,
      );

      expect(res.body).toMatchObject({
        codigo: 'ARCHIVO_DEMASIADO_GRANDE',
        mensaje: 'El archivo supera el tamaño máximo permitido',
      });
      expect(storage.files.size).toBe(filesBefore);
    });

    it('sin archivo responde 422 IMAGEN_REQUERIDA', async () => {
      const res = await upload(staffToken, 'Sin archivo', null).expect(422);

      expect(res.body.codigo).toBe('IMAGEN_REQUERIDA');
    });

    it('acepta "imagen" vacía como texto, como la envía Swagger sin archivo, y dice que falta', async () => {
      const res = await upload(staffToken, 'Desde Swagger', null)
        .field('imagen', '')
        .expect(422);

      expect(res.body.codigo).toBe('IMAGEN_REQUERIDA');
    });

    it('rechaza "imagen" como texto con contenido', async () => {
      const res = await upload(staffToken, 'Imagen falsa', null)
        .field('imagen', 'https://otro-sitio.com/foto.png')
        .expect(400);

      expect(res.body.detalles).toEqual([
        { campo: 'imagen', errores: ['La imagen debe enviarse como archivo'] },
      ]);
    });

    it('responde 400 con mensajes en español si faltan el título o el texto alternativo', async () => {
      const res = await http
        .post('/api/v1/galeria')
        .set('Authorization', `Bearer ${staffToken}`)
        .attach('imagen', PNG, 'foto.png')
        .expect(400);

      expect(res.body.codigo).toBe('VALIDACION');
      expect(res.body.detalles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            campo: 'titulo',
            errores: expect.arrayContaining(['El título es obligatorio']),
          }),
          expect.objectContaining({
            campo: 'textoAlternativo',
            errores: expect.arrayContaining([
              'El texto alternativo es obligatorio',
            ]),
          }),
        ]),
      );
    });

    it('rechaza campos que no existen en el formulario', async () => {
      const res = await upload(staffToken, 'Con extra')
        .field('subidaPor', 'otro-usuario')
        .expect(400);

      expect(res.body.detalles).toEqual([
        expect.objectContaining({ campo: 'subidaPor' }),
      ]);
    });

    it('un título solo de espacios responde 422 TITULO_REQUERIDO', async () => {
      const res = await upload(staffToken, '   ').expect(422);

      expect(res.body.codigo).toBe('TITULO_REQUERIDO');
    });
  });

  describe('GET /api/v1/galeria con imágenes', () => {
    beforeAll(async () => {
      // Se espera un poco entre subidas para que cada una tenga su propia fecha.
      for (const titulo of ['Sala 1', 'Sala 2', 'Sala 3']) {
        await wait(5);
        await upload(staffToken, titulo).expect(201);
      }
    });

    it('sin sesión lista las imágenes, las más recientes primero', async () => {
      const res = await http.get('/api/v1/galeria').expect(200);

      const titulos = res.body.datos.map((i: { titulo: string }) => i.titulo);
      expect(titulos.slice(0, 3)).toEqual(['Sala 3', 'Sala 2', 'Sala 1']);
      expect(res.body.total).toBe(5);
      expect(res.body.datos[0]).toEqual({
        id: expect.any(String),
        titulo: 'Sala 3',
        textoAlternativo: 'Texto de Sala 3',
        imagenUrl: expect.stringMatching(/^\/archivos\/gallery\//),
        creadoEn: expect.any(String),
      });
    });

    it('pagina con "pagina" y "porPagina" e informa el total de páginas', async () => {
      const first = await http
        .get('/api/v1/galeria?pagina=1&porPagina=2')
        .expect(200);
      const last = await http
        .get('/api/v1/galeria?pagina=3&porPagina=2')
        .expect(200);
      const beyond = await http
        .get('/api/v1/galeria?pagina=9&porPagina=2')
        .expect(200);

      expect(first.body).toMatchObject({
        pagina: 1,
        porPagina: 2,
        total: 5,
        totalPaginas: 3,
      });
      expect(first.body.datos).toHaveLength(2);
      expect(last.body.datos).toHaveLength(1);
      expect(beyond.body.datos).toEqual([]);
      expect(beyond.body.total).toBe(5);
    });

    it('las páginas no repiten ni se saltan imágenes', async () => {
      const ids: string[] = [];
      for (const pagina of [1, 2, 3]) {
        const res = await http.get(
          `/api/v1/galeria?pagina=${pagina}&porPagina=2`,
        );
        ids.push(...res.body.datos.map((i: { id: string }) => i.id));
      }

      expect(ids).toHaveLength(5);
      expect(new Set(ids).size).toBe(5);
    });

    it('ordena por las más antiguas con orden=antiguas', async () => {
      const res = await http.get('/api/v1/galeria?orden=antiguas').expect(200);

      const fechas = res.body.datos.map((i: { creadoEn: string }) =>
        Date.parse(i.creadoEn),
      );
      expect(fechas).toEqual([...fechas].sort((a, b) => a - b));
    });

    it('busca por título sin distinguir mayúsculas', async () => {
      const res = await http.get('/api/v1/galeria?buscar=SALA').expect(200);

      expect(res.body.total).toBe(3);
      expect(
        res.body.datos.every((i: { titulo: string }) =>
          i.titulo.startsWith('Sala'),
        ),
      ).toBe(true);
    });

    it('una búsqueda sin coincidencias devuelve una lista vacía', async () => {
      const res = await http.get('/api/v1/galeria?buscar=nada').expect(200);

      expect(res.body).toMatchObject({ datos: [], total: 0, totalPaginas: 0 });
    });

    it.each([
      ['pagina=0', 'pagina'],
      ['pagina=abc', 'pagina'],
      ['porPagina=0', 'porPagina'],
      ['porPagina=51', 'porPagina'],
      ['orden=aleatorio', 'orden'],
      ['filtro=algo', 'filtro'],
    ])('rechaza %s con 400', async (query, campo) => {
      const res = await http.get(`/api/v1/galeria?${query}`).expect(400);

      expect(res.body.codigo).toBe('VALIDACION');
      expect(res.body.detalles).toEqual([expect.objectContaining({ campo })]);
    });
  });

  describe('DELETE /api/v1/galeria/:id', () => {
    let id: string;
    let key: string;

    beforeAll(async () => {
      const res = await upload(staffToken, 'Para eliminar').expect(201);
      id = res.body.id as string;
      key = keyOf(res.body.imagenUrl as string);
    });

    it('sin sesión responde 401', async () => {
      await http.delete(`/api/v1/galeria/${id}`).expect(401);
    });

    it('un usuario público responde 403 y la imagen sigue ahí', async () => {
      await http
        .delete(`/api/v1/galeria/${id}`)
        .set('Authorization', `Bearer ${publicToken}`)
        .expect(403);

      expect(storage.files.has(key)).toBe(true);
    });

    it('un id que no existe o que no es un UUID responde 404', async () => {
      await http
        .delete('/api/v1/galeria/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);
      const res = await http
        .delete('/api/v1/galeria/no-es-un-id')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);

      expect(res.body.codigo).toBe('RECURSO_NO_ENCONTRADO');
    });

    it('el personal elimina la imagen: desaparece de la galería y del almacenamiento', async () => {
      await http
        .delete(`/api/v1/galeria/${id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(204);

      const list = await http.get('/api/v1/galeria?buscar=eliminar');
      expect(list.body.total).toBe(0);
      expect(storage.files.has(key)).toBe(false);
    });

    it('eliminarla otra vez responde 404', async () => {
      await http
        .delete(`/api/v1/galeria/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
