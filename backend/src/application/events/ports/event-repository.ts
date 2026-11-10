import type { AgendaEvent } from '../../../domain/events/agenda-event.js';

export interface EventRepository {
  findById(id: string): Promise<AgendaEvent | null>;
  save(event: AgendaEvent): Promise<void>;
}

export const EVENT_REPOSITORY = Symbol('EventRepository');
