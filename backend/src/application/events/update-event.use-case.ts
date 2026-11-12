import type { AgendaEventChanges } from '../../domain/events/agenda-event.js';
import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import { type EventView, toEventView } from './event-view.js';
import type { EventRepository } from './ports/event-repository.js';

/** El personal cambia los datos o las fechas de publicación de un evento. */
export class UpdateEventUseCase {
  private readonly now: () => Date;

  constructor(
    private readonly events: EventRepository,
    options: { now?: () => Date } = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async execute(id: string, changes: AgendaEventChanges): Promise<EventView> {
    const event = await this.events.findById(id);
    if (!event) {
      throw new ResourceNotFoundError('Evento', id);
    }
    const now = this.now();
    event.update(changes, now);
    await this.events.save(event);
    return toEventView(event, now);
  }
}
