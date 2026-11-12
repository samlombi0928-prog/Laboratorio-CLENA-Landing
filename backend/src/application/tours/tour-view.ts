import type { Tour } from '../../domain/tours/tour.js';
import type { TourStatus } from '../../domain/tours/tour-status.js';
import type { FileStorage } from '../storage/ports/file-storage.js';

/** Datos de un recorrido que devuelven los casos de uso. */
export interface TourView {
  id: string;
  title: string;
  description: string;
  status: TourStatus;
  coverUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toTourView(tour: Tour, storage: FileStorage): TourView {
  return {
    id: tour.id,
    title: tour.title,
    description: tour.description,
    status: tour.status,
    coverUrl: tour.coverKey ? storage.urlFor(tour.coverKey) : null,
    createdAt: tour.createdAt,
    updatedAt: tour.updatedAt,
  };
}
