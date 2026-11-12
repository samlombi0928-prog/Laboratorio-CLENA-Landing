import type {
  EventPageResult,
  EventQuery,
  EventRepository,
} from '../../src/application/events/ports/event-repository.js';
import type { AgendaEvent } from '../../src/domain/events/agenda-event.js';

/** Repositorio en memoria que imita el filtro, el orden y la paginación del real. */
export class InMemoryEventRepository implements EventRepository {
  readonly events = new Map<string, AgendaEvent>();

  findById(id: string): Promise<AgendaEvent | null> {
    return Promise.resolve(this.events.get(id) ?? null);
  }

  findPage(query: EventQuery): Promise<EventPageResult> {
    const search = query.search?.toLowerCase();
    const matching = [...this.events.values()]
      .filter((e) => !query.status || e.statusAt(query.now) === query.status)
      .filter(
        (e) =>
          !search ||
          e.title.toLowerCase().includes(search) ||
          e.location.toLowerCase().includes(search),
      )
      .sort(
        (a, b) =>
          a.startsAt.getTime() - b.startsAt.getTime() ||
          a.id.localeCompare(b.id),
      );
    const start = (query.page - 1) * query.pageSize;
    return Promise.resolve({
      items: matching.slice(start, start + query.pageSize),
      total: matching.length,
    });
  }

  save(event: AgendaEvent): Promise<void> {
    this.events.set(event.id, event);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.events.delete(id);
    return Promise.resolve();
  }
}
