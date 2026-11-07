import type { TourRepository } from '../../src/application/tours/ports/tour-repository.js';
import type { Tour } from '../../src/domain/tours/tour.js';

export class InMemoryTourRepository implements TourRepository {
  readonly tours = new Map<string, Tour>();

  findById(id: string): Promise<Tour | null> {
    return Promise.resolve(this.tours.get(id) ?? null);
  }

  findByOwner(ownerId: string): Promise<Tour[]> {
    const owned = [...this.tours.values()]
      .filter((tour) => tour.isOwnedBy(ownerId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(owned);
  }

  save(tour: Tour): Promise<void> {
    this.tours.set(tour.id, tour);
    return Promise.resolve();
  }
}
