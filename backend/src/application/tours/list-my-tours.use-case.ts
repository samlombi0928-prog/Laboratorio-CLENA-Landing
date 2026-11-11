import {
  buildPage,
  normalizePageRequest,
  type Page,
  type PageRequest,
} from '../common/pagination.js';
import type { FileStorage } from '../storage/ports/file-storage.js';
import type { TourRepository } from './ports/tour-repository.js';
import { toTourView, type TourView } from './tour-view.js';

/** Recorridos del usuario con sesión iniciada, incluidos sus borradores. */
export class ListMyToursUseCase {
  constructor(
    private readonly tours: TourRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    ownerId: string,
    input: Partial<PageRequest> = {},
  ): Promise<Page<TourView>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.tours.findByOwner(ownerId, request);
    return buildPage(
      items.map((tour) => toTourView(tour, this.storage)),
      request,
      total,
    );
  }
}
