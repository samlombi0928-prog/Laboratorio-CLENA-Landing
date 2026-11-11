import type {
  Mailer,
  MailMessage,
} from '../../src/application/notifications/ports/mailer.js';

/** Buzón en memoria: guarda los correos en vez de enviarlos. */
export class InMemoryMailer implements Mailer {
  readonly sent: MailMessage[] = [];
  failing = false;

  send(message: MailMessage): Promise<void> {
    if (this.failing) {
      return Promise.reject(new Error('El servidor de correo no responde'));
    }
    this.sent.push(message);
    return Promise.resolve();
  }
}
