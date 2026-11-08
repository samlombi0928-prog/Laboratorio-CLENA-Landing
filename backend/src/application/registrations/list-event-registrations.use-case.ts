import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { Registration } from '../../domain/registrations/registration.js';
import {
  buildPage,
  normalizePageRequest,
  type Page,
  type PageRequest,
} from '../common/pagination.js';
import type { EventRepository } from '../events/ports/event-repository.js';
import type { RegistrationRepository } from './ports/registration-repository.js';

export interface ListEventRegistrationsInput extends Partial<PageRequest> {
  eventId: string;
  /** Filtra por nombre o correo. */
  search?: string;
}

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
    input: ListEventRegistrationsInput,
  ): Promise<Page<RegistrationView>> {
    const event = await this.events.findById(input.eventId);
    if (!event) {
      throw new ResourceNotFoundError('Evento', input.eventId);
    }

    const request = normalizePageRequest(input);
    const { items, total } = await this.registrations.findByEvent(
      input.eventId,
      { ...request, search: input.search },
    );
    return buildPage(items.map(toRegistrationView), request, total);
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
