import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { FileStorage } from '../storage/ports/file-storage.js';
import type { TourRepository } from './ports/tour-repository.js';
import { toTourView, type TourView } from './tour-view.js';

/**
 * Devuelve un recorrido si quien consulta lo puede ver. Un borrador ajeno
 * responde igual que uno que no existe, para no revelar que existe.
 */
export class GetTourUseCase {
  constructor(
    private readonly tours: TourRepository,
    private readonly storage: FileStorage,
  ) {}

  /** `viewerId` es null cuando quien consulta no ha iniciado sesión. */
  async execute(tourId: string, viewerId: string | null): Promise<TourView> {
    const tour = await this.tours.findById(tourId);
    if (!tour || !tour.isVisibleTo(viewerId)) {
      throw new ResourceNotFoundError('Recorrido', tourId);
    }
    return toTourView(tour, this.storage);
  }
}
