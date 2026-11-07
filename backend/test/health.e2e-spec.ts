import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DATABASE_CHECKER } from '../src/application/health/ports/database-checker.js';
import { HealthModule } from '../src/modules/health.module.js';
import { configureApp } from '../src/presentation/http/configure-app.js';

describe('Salud y documentación (e2e)', () => {
  let app: INestApplication<App>;
  const databaseChecker = { isAvailable: vi.fn<() => Promise<boolean>>() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(DATABASE_CHECKER)
      .useValue(databaseChecker)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health responde 200 cuando la base de datos está disponible', async () => {
    databaseChecker.isAvailable.mockResolvedValueOnce(true);

    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body).toMatchObject({ estado: 'ok', baseDatos: 'disponible' });
  });

  it('GET /api/v1/health responde 503 cuando la base de datos no responde', async () => {
    databaseChecker.isAvailable.mockResolvedValueOnce(false);

    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(503);

    expect(res.body).toMatchObject({
      estado: 'degradado',
      baseDatos: 'no disponible',
    });
  });

  it('/health sin el prefijo /api/v1 responde 404', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('publica la documentación Swagger en /docs', async () => {
    await request(app.getHttpServer()).get('/docs').expect(200);

    const res = await request(app.getHttpServer())
      .get('/docs/json')
      .expect(200);

    expect(res.body.info.title).toBe('API Recorrido CLENA');
    expect(res.body.paths).toHaveProperty('/api/v1/health');
  });
});
