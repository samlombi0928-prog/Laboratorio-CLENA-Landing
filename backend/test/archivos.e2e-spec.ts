import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { serveStoredFiles } from '../src/infrastructure/storage/serve-stored-files.js';
import { configureApp } from '../src/presentation/http/configure-app.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);

describe('Archivos guardados (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let workDir: string;
  let key: string;

  beforeAll(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'clena-archivos-'));
    const rootDir = join(workDir, 'storage');
    key = `gallery/${randomUUID()}.png`;
    await mkdir(join(rootDir, 'gallery'), { recursive: true });
    await writeFile(join(rootDir, key), PNG);
    // Un archivo a medio escribir y un secreto fuera de la carpeta.
    await writeFile(join(rootDir, `${key}.tmp`), PNG);
    await writeFile(join(workDir, 'secreto.png'), 'no debe salir');

    const moduleRef = await Test.createTestingModule({}).compile();
    app = moduleRef.createNestApplication({ logger: false });
    // Igual que en main.ts: el middleware se monta antes de configureApp.
    app.use('/archivos', serveStoredFiles(rootDir));
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    await rm(workDir, { recursive: true, force: true });
  });

  it('sirve el archivo con su tipo, caché de un año y nosniff', async () => {
    const res = await http.get(`/archivos/${key}`).expect(200);

    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.body).toEqual(PNG);
  });

  it('un archivo que no existe responde 404 con el formato JSON de la API', async () => {
    const res = await http
      .get(`/archivos/gallery/${randomUUID()}.png`)
      .expect(404);

    expect(res.body).toEqual({
      estado: 404,
      codigo: 'NO_ENCONTRADO',
      mensaje: 'El archivo no existe',
      ruta: expect.stringMatching(/^\/archivos\/gallery\/.+\.png$/),
      fecha: expect.any(String),
    });
  });

  it.each([
    '/archivos/gallery/..%2F..%2Fsecreto.png',
    '/archivos/..%2Fsecreto.png',
    '/archivos/gallery/%2e%2e/%2e%2e/secreto.png',
    '/archivos/secreto.png',
    '/archivos/gallery/archivo.txt',
    '/archivos/',
  ])('no sirve nada con la ruta %s', async (path) => {
    const res = await http.get(path).expect(404);

    expect(res.body.codigo).toBe('NO_ENCONTRADO');
  });

  it('no sirve un archivo .tmp a medio escribir', async () => {
    await http.get(`/archivos/${key}.tmp`).expect(404);
  });

  it('solo atiende GET y HEAD: otros métodos responden 405 en JSON', async () => {
    const res = await http.post(`/archivos/${key}`).expect(405);

    expect(res.headers.allow).toBe('GET, HEAD');
    expect(res.body.codigo).toBe('METODO_NO_PERMITIDO');
    await http.delete(`/archivos/${key}`).expect(405);
    await http.head(`/archivos/${key}`).expect(200);
  });
});
