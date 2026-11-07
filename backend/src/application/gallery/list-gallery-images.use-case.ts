import {
  buildPage,
  normalizePageRequest,
  type Page,
  type PageRequest,
} from '../common/pagination.js';
import type { FileStorage } from '../storage/ports/file-storage.js';
import {
  toGalleryImageView,
  type GalleryImageView,
} from './gallery-image-view.js';
import type {
  GalleryImageRepository,
  GalleryOrder,
} from './ports/gallery-image-repository.js';

export interface ListGalleryImagesInput extends Partial<PageRequest> {
  /** Por defecto, las más recientes primero. */
  order?: GalleryOrder;
  /** Texto que debe contener el título. */
  search?: string;
}

/** Lista las imágenes de la galería, con paginación, orden y búsqueda por título. */
export class ListGalleryImagesUseCase {
  constructor(
    private readonly images: GalleryImageRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    input: ListGalleryImagesInput = {},
  ): Promise<Page<GalleryImageView>> {
    const request = normalizePageRequest(input);
    const search = input.search?.trim() || undefined;

    const { items, total } = await this.images.findPage({
      ...request,
      order: input.order ?? 'newest',
      search,
    });

    return buildPage(
      items.map((image) => toGalleryImageView(image, this.storage)),
      request,
      total,
    );
  }
}
