import type { Tour } from '../../../domain/tours/tour.js';
import type { PageRequest } from '../../common/pagination.js';

export interface TourPageResult {
  /** Solo los recorridos de la página pedida. */
  items: Tour[];
  /** Total de recorridos del usuario, en todas las páginas. */
  total: number;
}

export interface TourRepository {
  findById(id: string): Promise<Tour | null>;
  /** Recorridos del usuario, del más reciente al más antiguo. */
  findByOwner(ownerId: string, page: PageRequest): Promise<TourPageResult>;
  save(tour: Tour): Promise<void>;
}

export const TOUR_REPOSITORY = Symbol('TourRepository');
