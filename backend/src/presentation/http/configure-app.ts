import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import { API_PREFIX } from './api-prefix.js';
import { ErrorResponse } from './errors/error-response.js';
import { GlobalExceptionFilter } from './errors/global-exception.filter.js';
import { createValidationPipe } from './validation/validation-pipe.js';

export { API_PREFIX };
export const DOCS_PATH = 'docs';

/**
 * Configuración HTTP común a main.ts y a las pruebas e2e, para que las pruebas
 * ejerciten la API tal como corre en producción.
 */
export function configureApp(app: INestApplication): void {
  trustReverseProxy(app);
  app.setGlobalPrefix(API_PREFIX);
  app.use(cookieParser());
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  configureSwagger(app);
}

/**
 * Detrás de un proxy (Nginx en Docker) la IP del visitante llega en
 * X-Forwarded-For. Se confía solo en el último salto, el que agrega el proxy:
 * el límite de intentos queda por visitante y no se puede esquivar mandando un
 * X-Forwarded-For falso.
 */
function trustReverseProxy(app: INestApplication): void {
  const server: Express = app.getHttpAdapter().getInstance();
  server.set('trust proxy', 1);
}

function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API Recorrido CLENA')
    .setDescription(
      'API REST del recorrido interactivo del CLENA. Todas las rutas de negocio están bajo /api/v1.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refresh_token')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponse],
  });
  SwaggerModule.setup(DOCS_PATH, app, document, {
    jsonDocumentUrl: `${DOCS_PATH}/json`,
  });
}
