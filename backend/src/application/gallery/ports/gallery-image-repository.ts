import type { GalleryImage } from '../../../domain/gallery/gallery-image.js';
import type { PageRequest } from '../../common/pagination.js';

/** Orden del listado: por fecha de subida. */
export type GalleryOrder = 'newest' | 'oldest';

export interface GalleryQuery extends PageRequest {
  order: GalleryOrder;
  /** Texto que debe contener el título, sin distinguir mayúsculas. */
  search?: string;
}

export interface GalleryPageResult {
  /** Solo las imágenes de la página pedida. */
  items: GalleryImage[];
  /** Total de imágenes que cumplen el filtro, en todas las páginas. */
  total: number;
}

export interface GalleryImageRepository {
  findById(id: string): Promise<GalleryImage | null>;
  findPage(query: GalleryQuery): Promise<GalleryPageResult>;
  save(image: GalleryImage): Promise<void>;
  delete(id: string): Promise<void>;
}

export const GALLERY_IMAGE_REPOSITORY = Symbol('GalleryImageRepository');
