import type { Tour } from '../../../domain/tours/tour.js';

export interface TourRepository {
  findById(id: string): Promise<Tour | null>;
  /** Recorridos del usuario, del más reciente al más antiguo. */
  findByOwner(ownerId: string): Promise<Tour[]>;
  save(tour: Tour): Promise<void>;
}

export const TOUR_REPOSITORY = Symbol('TourRepository');
