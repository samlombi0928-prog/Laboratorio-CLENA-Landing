import { GalleryImage } from '../../domain/gallery/gallery-image.js';
import { GalleryImageOrmEntity } from './gallery-image.orm-entity.js';

/** Convierte entre la entidad de dominio y la fila de la base de datos. */
export const GalleryImageMapper = {
  toDomain(row: GalleryImageOrmEntity): GalleryImage {
    return GalleryImage.restore({
      id: row.id,
      title: row.title,
      altText: row.altText,
      imageKey: row.imageKey,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
    });
  },

  toPersistence(image: GalleryImage): GalleryImageOrmEntity {
    const row = new GalleryImageOrmEntity();
    row.id = image.id;
    row.title = image.title;
    row.altText = image.altText;
    row.imageKey = image.imageKey;
    row.uploadedBy = image.uploadedBy;
    row.createdAt = image.createdAt;
    return row;
  },
};
