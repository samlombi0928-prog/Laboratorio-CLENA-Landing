import { Tour } from '../../domain/tours/tour.js';
import type { TourStatus } from '../../domain/tours/tour-status.js';
import { TourOrmEntity } from './tour.orm-entity.js';

/** Convierte entre la entidad de dominio y la fila de la base de datos. */
export const TourMapper = {
  toDomain(row: TourOrmEntity): Tour {
    return Tour.restore({
      id: row.id,
      ownerId: row.ownerId,
      title: row.title,
      description: row.description,
      coverKey: row.coverKey,
      status: row.status as TourStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(tour: Tour): TourOrmEntity {
    const row = new TourOrmEntity();
    row.id = tour.id;
    row.ownerId = tour.ownerId;
    row.title = tour.title;
    row.description = tour.description;
    row.coverKey = tour.coverKey;
    row.status = tour.status;
    row.createdAt = tour.createdAt;
    row.updatedAt = tour.updatedAt;
    return row;
  },
};
