import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { FileStorage } from '../storage/ports/file-storage.js';
import type { GalleryImageRepository } from './ports/gallery-image-repository.js';

/** Elimina una imagen de la galería y su archivo del almacenamiento. */
export class DeleteGalleryImageUseCase {
  constructor(
    private readonly images: GalleryImageRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(id: string): Promise<void> {
    const image = await this.images.findById(id);
    if (!image) {
      throw new ResourceNotFoundError('Imagen', id);
    }

    // Primero la fila y luego el archivo. Si fallara el segundo paso, queda un
    // archivo sin dueño (inofensivo); al revés, la galería mostraría una
    // imagen rota.
    await this.images.delete(id);
    await this.storage.delete(image.imageKey);
  }
}
