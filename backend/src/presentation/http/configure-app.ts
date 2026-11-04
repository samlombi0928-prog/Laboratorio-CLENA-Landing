import type { INestApplication } from '@nestjs/common';
import { GlobalExceptionFilter } from './errors/global-exception.filter.js';
import { createValidationPipe } from './validation/validation-pipe.js';

export const API_PREFIX = 'api/v1';

/**
 * Configuración HTTP común a main.ts y a las pruebas e2e, para que las pruebas
 * ejerciten la API tal como corre en producción.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
}
