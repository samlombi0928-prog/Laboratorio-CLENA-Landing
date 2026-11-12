import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { EventRepository } from './ports/event-repository.js';

/** El personal elimina un evento de la agenda, con sus inscripciones. */
export class DeleteEventUseCase {
  constructor(private readonly events: EventRepository) {}

  async execute(id: string): Promise<void> {
    const event = await this.events.findById(id);
    if (!event) {
      throw new ResourceNotFoundError('Evento', id);
    }
    await this.events.delete(id);
  }
}
