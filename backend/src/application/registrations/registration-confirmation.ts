import type { AgendaEvent } from '../../domain/events/agenda-event.js';
import type { Registration } from '../../domain/registrations/registration.js';
import type { MailMessage } from '../notifications/ports/mailer.js';

// El CLENA queda en Barranquilla: la hora del evento se muestra en hora de Colombia.
const EVENT_DATE = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

/** Correo que confirma la inscripción a un evento. */
export function buildRegistrationConfirmation(
  event: AgendaEvent,
  registration: Registration,
): MailMessage {
  return {
    to: registration.email,
    subject: `Inscripción confirmada: ${event.title}`,
    text: [
      `Hola, ${registration.name}:`,
      '',
      `Su inscripción en "${event.title}" quedó confirmada.`,
      '',
      `Fecha: ${EVENT_DATE.format(event.startsAt)}`,
      `Lugar: ${event.location}`,
      '',
      'Lo esperamos.',
      'Corporación Luis Eduardo Nieto Arteta (CLENA)',
    ].join('\n'),
  };
}
