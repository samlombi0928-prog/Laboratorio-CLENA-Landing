import type { GalleryImage } from '../../domain/gallery/gallery-image.js';
import type { FileStorage } from '../storage/ports/file-storage.js';

/** Datos de una imagen de la galería que devuelven los casos de uso. */
export interface GalleryImageView {
  id: string;
  title: string;
  altText: string;
  imageUrl: string;
  createdAt: Date;
}

export function toGalleryImageView(
  image: GalleryImage,
  storage: FileStorage,
): GalleryImageView {
  return {
    id: image.id,
    title: image.title,
    altText: image.altText,
    // La base de datos guarda la clave; la URL se calcula al responder.
    imageUrl: storage.urlFor(image.imageKey),
    createdAt: image.createdAt,
  };
}
