import { EventStatus } from '../../domain/events/event-status.js';
import {
  buildPage,
  normalizePageRequest,
  type Page,
  type PageRequest,
} from '../common/pagination.js';
import { type EventView, toEventView } from './event-view.js';
import type { EventRepository } from './ports/event-repository.js';

export interface ListEventsInput extends Partial<PageRequest> {
  /** true en la agenda pública: solo los publicados, sin importar `status`. */
  onlyPublished: boolean;
  /** Filtro del panel del personal. */
  status?: EventStatus;
  search?: string;
}

/** Lista los eventos del más próximo al más lejano, con paginación y filtros. */
export class ListEventsUseCase {
  private readonly now: () => Date;

  constructor(
    private readonly events: EventRepository,
    options: { now?: () => Date } = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async execute(input: ListEventsInput): Promise<Page<EventView>> {
    const request = normalizePageRequest(input);
    const now = this.now();
    const { items, total } = await this.events.findPage({
      ...request,
      status: input.onlyPublished ? EventStatus.Published : input.status,
      search: input.search?.trim() || undefined,
      now,
    });
    return buildPage(
      items.map((event) => toEventView(event, now)),
      request,
      total,
    );
  }
}
