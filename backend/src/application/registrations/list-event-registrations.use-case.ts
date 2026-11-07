import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { Registration } from '../../domain/registrations/registration.js';
import type { Page } from '../common/page.js';
import type { EventRepository } from '../events/ports/event-repository.js';
import type {
  RegistrationQuery,
  RegistrationRepository,
} from './ports/registration-repository.js';

export interface RegistrationView {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/** Lista de inscritos de un evento, para el personal del CLENA. */
export class ListEventRegistrationsUseCase {
  constructor(
    private readonly events: EventRepository,
    private readonly registrations: RegistrationRepository,
  ) {}

  async execute(
    eventId: string,
    query: RegistrationQuery,
  ): Promise<Page<RegistrationView>> {
    const event = await this.events.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundError('Evento', eventId);
    }

    const page = await this.registrations.findByEvent(eventId, query);
    return { ...page, items: page.items.map(toRegistrationView) };
  }
}

function toRegistrationView(registration: Registration): RegistrationView {
  return {
    id: registration.id,
    name: registration.name,
    email: registration.email,
    createdAt: registration.createdAt,
  };
}
