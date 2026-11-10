import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { EnvironmentVariables } from './infrastructure/config/environment-variables.js';
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
  app.enableShutdownHooks();
  configureApp(app);

  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
