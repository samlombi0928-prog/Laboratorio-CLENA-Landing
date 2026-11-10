import { randomUUID } from 'node:crypto';
import { BusinessRuleError } from '../../domain/errors/domain-errors.js';
import {
  GalleryImage,
  validateGalleryText,
} from '../../domain/gallery/gallery-image.js';
import { detectImageType } from '../storage/detect-image-type.js';
import type {
  FileStorage,
  ImageContentType,
} from '../storage/ports/file-storage.js';
import {
  toGalleryImageView,
  type GalleryImageView,
} from './gallery-image-view.js';
import type { GalleryImageRepository } from './ports/gallery-image-repository.js';

/** Tamaño máximo de una imagen de la galería: 10 MB. */
export const MAX_GALLERY_IMAGE_BYTES = 10 * 1024 * 1024;

export interface UploadGalleryImageInput {
  uploadedBy: string;
  title: string;
  altText: string;
  /** Contenido de la imagen. Es undefined si no se adjuntó ningún archivo. */
  image?: Uint8Array;
}

export interface UploadGalleryImageOptions {
  now?: () => Date;
  generateId?: () => string;
}

function imageContentType(image: Uint8Array | undefined): ImageContentType {
  if (!image || image.length === 0) {
    throw new BusinessRuleError('Debe adjuntar una imagen', 'IMAGEN_REQUERIDA');
  }
  if (image.length > MAX_GALLERY_IMAGE_BYTES) {
    throw new BusinessRuleError(
      'La imagen puede pesar máximo 10 MB',
      'ARCHIVO_DEMASIADO_GRANDE',
    );
  }
  const contentType = detectImageType(image);
  if (!contentType) {
    throw new BusinessRuleError(
      'La imagen debe ser un archivo JPG o PNG',
      'TIPO_DE_IMAGEN_NO_VALIDO',
    );
  }
  return contentType;
}

/** Sube una imagen a la galería a nombre de quien la sube. */
export class UploadGalleryImageUseCase {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly images: GalleryImageRepository,
    private readonly storage: FileStorage,
    options: UploadGalleryImageOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  async execute(input: UploadGalleryImageInput): Promise<GalleryImageView> {
    // Se valida todo antes de guardar el archivo, para no dejar archivos
    // sueltos en el disco cuando la petición es inválida.
    const text = validateGalleryText(input);
    const contentType = imageContentType(input.image);

    const stored = await this.storage.save({
      content: input.image!,
      contentType,
      folder: 'gallery',
    });
    const image = GalleryImage.create({
      id: this.generateId(),
      ...text,
      imageKey: stored.key,
      uploadedBy: input.uploadedBy,
      now: this.now(),
    });
    try {
      await this.images.save(image);
    } catch (error) {
      // Si la base de datos falla, el archivo ya subido quedaría huérfano.
      // Si además falla el borrado, se ignora ese segundo error: el que
      // importa es el de la base de datos y no debe quedar tapado.
      await this.storage.delete(stored.key).catch(() => undefined);
      throw error;
    }
    return toGalleryImageView(image, this.storage);
  }
}
