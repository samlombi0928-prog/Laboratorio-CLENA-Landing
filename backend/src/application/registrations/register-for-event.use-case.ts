import { randomUUID } from 'node:crypto';
import {
  ConflictError,
  ResourceNotFoundError,
} from '../../domain/errors/domain-errors.js';
import { Registration } from '../../domain/registrations/registration.js';
import { PRIVACY_NOTICE_VERSION } from '../../domain/users/privacy-notice.js';
import type { EventRepository } from '../events/ports/event-repository.js';
import type { Mailer } from '../notifications/ports/mailer.js';
import type { RegistrationRepository } from './ports/registration-repository.js';
import { buildRegistrationConfirmation } from './registration-confirmation.js';

export const EVENT_FULL = 'EVENTO_SIN_CUPOS';

export interface RegisterForEventInput {
  eventId: string;
  name: string;
  email: string;
  acceptsPrivacyNotice: boolean;
}

export interface RegistrationResult {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  createdAt: Date;
  /** false si la inscripción quedó guardada pero el correo no se pudo enviar. */
  confirmationSent: boolean;
}

export interface RegisterForEventOptions {
  now?: () => Date;
  generateId?: () => string;
}

export class RegisterForEventUseCase {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly events: EventRepository,
    private readonly registrations: RegistrationRepository,
    private readonly mailer: Mailer,
    options: RegisterForEventOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  async execute(input: RegisterForEventInput): Promise<RegistrationResult> {
    const now = this.now();
    const event = await this.events.findById(input.eventId);
    // Un evento que no está publicado no existe para el público.
    if (!event || !event.isPublishedAt(now)) {
      throw new ResourceNotFoundError('Evento', input.eventId);
    }

    const registration = Registration.create({
      id: this.generateId(),
      eventId: event.id,
      name: input.name,
      email: input.email,
      acceptsPrivacyNotice: input.acceptsPrivacyNotice,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      now,
    });

    const added = await this.registrations.addIfSeatsAvailable(
      registration,
      event.capacity,
    );
    if (!added) {
      throw new ConflictError(
        'El evento ya no tiene cupos disponibles',
        EVENT_FULL,
      );
    }

    // La inscripción ya quedó guardada: si el correo falla no se deshace,
    // solo se avisa en la respuesta.
    const confirmationSent = await this.mailer
      .send(buildRegistrationConfirmation(event, registration))
      .then(
        () => true,
        () => false,
      );

    return {
      id: registration.id,
      eventId: event.id,
      eventTitle: event.title,
      name: registration.name,
      email: registration.email,
      createdAt: registration.createdAt,
      confirmationSent,
    };
  }
}
