import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAILER } from '../application/notifications/ports/mailer.js';
import type { EnvironmentVariables } from '../infrastructure/config/environment-variables.js';
import { SmtpMailer } from '../infrastructure/notifications/smtp-mailer.js';

type AppConfig = ConfigService<EnvironmentVariables, true>;

/** Envío de correos. Las pruebas e2e lo cambian por un buzón en memoria. */
@Module({
  providers: [
    {
      provide: MAILER,
      inject: [ConfigService],
      useFactory: (config: AppConfig) =>
        new SmtpMailer({
          host: config.get('SMTP_HOST', { infer: true }),
          port: config.get('SMTP_PORT', { infer: true }),
          from: config.get('MAIL_FROM', { infer: true }),
        }),
    },
  ],
  exports: [MAILER],
})
export class NotificationsModule {}
