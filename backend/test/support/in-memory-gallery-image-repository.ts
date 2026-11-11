import type {
  GalleryImageRepository,
  GalleryPageResult,
  GalleryQuery,
} from '../../src/application/gallery/ports/gallery-image-repository.js';
import type { GalleryImage } from '../../src/domain/gallery/gallery-image.js';

/** Repositorio en memoria que imita el orden, la búsqueda y la paginación del real. */
export class InMemoryGalleryImageRepository implements GalleryImageRepository {
  readonly images = new Map<string, GalleryImage>();

  findById(id: string): Promise<GalleryImage | null> {
    return Promise.resolve(this.images.get(id) ?? null);
  }

  findPage(query: GalleryQuery): Promise<GalleryPageResult> {
    const search = query.search?.toLowerCase();
    const direction = query.order === 'oldest' ? 1 : -1;
    const matching = [...this.images.values()]
      .filter((image) => !search || image.title.toLowerCase().includes(search))
      // Igual que la consulta real: por fecha y, si empatan, por id.
      .sort(
        (a, b) =>
          direction *
          (a.createdAt.getTime() - b.createdAt.getTime() ||
            a.id.localeCompare(b.id)),
      );
    const start = (query.page - 1) * query.pageSize;
    return Promise.resolve({
      items: matching.slice(start, start + query.pageSize),
      total: matching.length,
    });
  }

  save(image: GalleryImage): Promise<void> {
    this.images.set(image.id, image);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.images.delete(id);
    return Promise.resolve();
  }
}
