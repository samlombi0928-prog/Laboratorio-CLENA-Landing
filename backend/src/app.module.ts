import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import {
  validateEnvironment,
  type EnvironmentVariables,
} from './infrastructure/config/environment-variables.js';
import { createTypeOrmOptions } from './infrastructure/database/typeorm-options.js';
import { createLoggerOptions } from './infrastructure/logging/logger-options.js';
import { AccountModule } from './modules/account.module.js';
import { AuthModule } from './modules/auth.module.js';
import { EventsModule } from './modules/events.module.js';
import { GalleryModule } from './modules/gallery.module.js';
import { HealthModule } from './modules/health.module.js';
import { SectionsModule } from './modules/sections.module.js';
import { RegistrationsModule } from './modules/registrations.module.js';
import { UsersModule } from './modules/users.module.js';
import { ToursModule } from './modules/tours.module.js';

type AppConfig = ConfigService<EnvironmentVariables, true>;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: AppConfig) =>
        createLoggerOptions(config.get('LOG_LEVEL', { infer: true })),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: AppConfig) => ({
        ...createTypeOrmOptions({
          DB_HOST: config.get('DB_HOST', { infer: true }),
          DB_PORT: config.get('DB_PORT', { infer: true }),
          DB_USERNAME: config.get('DB_USERNAME', { infer: true }),
          DB_PASSWORD: config.get('DB_PASSWORD', { infer: true }),
          DB_NAME: config.get('DB_NAME', { infer: true }),
        }),
        autoLoadEntities: true,
      }),
    }),
    HealthModule,
    AuthModule,
    AccountModule,
    SectionsModule,
    EventsModule,
    RegistrationsModule,
    UsersModule,
    ToursModule,
    GalleryModule,
  ],
})
export class AppModule {}
