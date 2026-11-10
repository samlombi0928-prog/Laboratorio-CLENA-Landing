import type { EventRepository } from '../../src/application/events/ports/event-repository.js';
import type { AgendaEvent } from '../../src/domain/events/agenda-event.js';

export class InMemoryEventRepository implements EventRepository {
  readonly events = new Map<string, AgendaEvent>();

  findById(id: string): Promise<AgendaEvent | null> {
    return Promise.resolve(this.events.get(id) ?? null);
  }

  save(event: AgendaEvent): Promise<void> {
    this.events.set(event.id, event);
    return Promise.resolve();
  }
}
