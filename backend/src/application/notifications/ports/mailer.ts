export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  /** Envía el correo. Si no se puede enviar, la promesa se rechaza. */
  send(message: MailMessage): Promise<void>;
}

export const MAILER = Symbol('Mailer');
