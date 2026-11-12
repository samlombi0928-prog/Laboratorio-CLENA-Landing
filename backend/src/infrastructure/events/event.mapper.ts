import { AgendaEvent } from '../../domain/events/agenda-event.js';
import { EventOrmEntity } from './event.orm-entity.js';

/** Convierte entre la entidad de dominio y la fila de la base de datos. */
export const EventMapper = {
  toDomain(row: EventOrmEntity): AgendaEvent {
    return AgendaEvent.restore({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      startsAt: row.startsAt,
      capacity: row.capacity,
      publishFrom: row.publishFrom,
      publishUntil: row.publishUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(event: AgendaEvent): EventOrmEntity {
    const row = new EventOrmEntity();
    row.id = event.id;
    row.title = event.title;
    row.description = event.description;
    row.location = event.location;
    row.startsAt = event.startsAt;
    row.capacity = event.capacity;
    row.publishFrom = event.publishFrom;
    row.publishUntil = event.publishUntil;
    row.createdAt = event.createdAt;
    row.updatedAt = event.updatedAt;
    return row;
  },
};
