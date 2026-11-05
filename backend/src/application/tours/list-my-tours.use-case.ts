import type { FileStorage } from '../storage/ports/file-storage.js';
import type { TourRepository } from './ports/tour-repository.js';
import { toTourView, type TourView } from './tour-view.js';

/** Recorridos del usuario con sesión iniciada, incluidos sus borradores. */
export class ListMyToursUseCase {
  constructor(
    private readonly tours: TourRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(ownerId: string): Promise<TourView[]> {
    const tours = await this.tours.findByOwner(ownerId);
    return tours.map((tour) => toTourView(tour, this.storage));
  }
}
