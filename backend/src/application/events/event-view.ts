import type { AgendaEvent } from '../../domain/events/agenda-event.js';
import type { EventStatus } from '../../domain/events/event-status.js';

/** Datos de un evento que devuelven los casos de uso, con su estado actual. */
export interface EventView {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  capacity: number;
  publishFrom: Date;
  publishUntil: Date;
  status: EventStatus;
  updatedAt: Date;
}

export function toEventView(event: AgendaEvent, now: Date): EventView {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    capacity: event.capacity,
    publishFrom: event.publishFrom,
    publishUntil: event.publishUntil,
    status: event.statusAt(now),
    updatedAt: event.updatedAt,
  };
}
