import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { EnvironmentVariables } from './infrastructure/config/environment-variables.js';
import { serveStoredFiles } from './infrastructure/storage/serve-stored-files.js';
import { configureApp } from './presentation/http/configure-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(','),
    // Permite que el navegador envíe la cookie del refresh token.
    credentials: true,
  });
  // Los archivos subidos se sirven fuera de /api/v1: son recursos públicos y
  // sus URL no deben cambiar si cambia la versión de la API.
  app.use(
    '/archivos',
    serveStoredFiles(resolve(config.get('STORAGE_DIR', { infer: true }))),
  );
  app.enableShutdownHooks();
  configureApp(app);

  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
