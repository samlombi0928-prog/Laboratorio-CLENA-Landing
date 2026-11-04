import {
  Body,
  Controller,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../src/presentation/http/configure-app.js';

class ExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

@Controller('examples')
class ExampleController {
  @Post()
  create(@Body() dto: ExampleDto) {
    return dto;
  }
}

@Module({ controllers: [ExampleController] })
class ExampleModule {}

describe('Validación y errores (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExampleModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('expone las rutas bajo /api/v1', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/examples')
      .send({ name: 'Aduana' })
      .expect(201)
      .expect({ name: 'Aduana' });
  });

  it('responde 400 con el detalle de cada campo inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/examples')
      .send({ name: '', extra: true })
      .expect(400);

    expect(res.body).toMatchObject({
      estado: 400,
      codigo: 'VALIDACION',
      mensaje: 'Los datos enviados no son válidos',
      ruta: '/api/v1/examples',
    });
    const fields = res.body.detalles.map((d: { campo: string }) => d.campo);
    expect(fields).toEqual(expect.arrayContaining(['name', 'extra']));
  });

  it('responde 404 con el formato uniforme en rutas que no existen', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/no-existe')
      .expect(404);

    expect(res.body).toMatchObject({
      estado: 404,
      codigo: 'NO_ENCONTRADO',
      ruta: '/api/v1/no-existe',
    });
    expect(typeof res.body.fecha).toBe('string');
  });
});
