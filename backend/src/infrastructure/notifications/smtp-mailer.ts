import { Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type {
  Mailer,
  MailMessage,
} from '../../application/notifications/ports/mailer.js';

export interface SmtpMailerOptions {
  host: string;
  port: number;
  /** Remitente, por ejemplo "CLENA Digital <no-responder@clena.local>". */
  from: string;
}

/**
 * Envía correos por SMTP. En desarrollo apunta a Mailpit, que los atrapa y
 * los muestra en una página local en vez de entregarlos.
 */
export class SmtpMailer implements Mailer {
  private readonly logger = new Logger(SmtpMailer.name);
  private readonly transporter: Transporter;

  constructor(private readonly options: SmtpMailerOptions) {
    this.transporter = createTransport({
      host: options.host,
      port: options.port,
      secure: options.port === 465,
      // Sin estos límites, un servidor que no responde deja la petición
      // esperando dos minutos.
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    });
  }

  async send(message: MailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.options.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo "${message.subject}": ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
