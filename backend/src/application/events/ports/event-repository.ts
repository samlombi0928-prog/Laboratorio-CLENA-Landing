import type { AgendaEvent } from '../../../domain/events/agenda-event.js';
import type { EventStatus } from '../../../domain/events/event-status.js';
import type { PageRequest } from '../../common/pagination.js';

export interface EventQuery extends PageRequest {
  /** Solo los que están en este estado en `now`. Sin valor, todos. */
  status?: EventStatus;
  /** Texto que se busca en el título y el lugar, sin importar mayúsculas. */
  search?: string;
  /** Momento contra el que se calcula el estado. */
  now: Date;
}

export interface EventPageResult {
  /** Solo los eventos de la página pedida, del más próximo al más lejano. */
  items: AgendaEvent[];
  /** Total de eventos que cumplen el filtro, en todas las páginas. */
  total: number;
}

export interface EventRepository {
  findById(id: string): Promise<AgendaEvent | null>;
  findPage(query: EventQuery): Promise<EventPageResult>;
  save(event: AgendaEvent): Promise<void>;
  /** También borra sus inscripciones. */
  delete(id: string): Promise<void>;
}

export const EVENT_REPOSITORY = Symbol('EventRepository');
