import { randomUUID } from 'node:crypto';
import { BusinessRuleError } from '../../domain/errors/domain-errors.js';
import { Tour } from '../../domain/tours/tour.js';
import { detectImageType } from '../storage/detect-image-type.js';
import type {
  FileStorage,
  ImageContentType,
} from '../storage/ports/file-storage.js';
import type { TourRepository } from './ports/tour-repository.js';
import { toTourView, type TourView } from './tour-view.js';

/** Tamaño máximo de la imagen de portada: 5 MB. */
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export interface CreateTourInput {
  ownerId: string;
  title: string;
  description?: string;
  /** Contenido de la imagen de portada, si el creador subió una. */
  cover?: Uint8Array;
}

export interface CreateTourOptions {
  now?: () => Date;
  generateId?: () => string;
}

function coverContentType(cover: Uint8Array): ImageContentType {
  if (cover.length > MAX_COVER_BYTES) {
    throw new BusinessRuleError(
      'La portada puede pesar máximo 5 MB',
      'ARCHIVO_DEMASIADO_GRANDE',
    );
  }
  const contentType = detectImageType(cover);
  if (!contentType) {
    throw new BusinessRuleError(
      'La portada debe ser una imagen JPG o PNG',
      'TIPO_DE_IMAGEN_NO_VALIDO',
    );
  }
  return contentType;
}

/** Crea un recorrido en borrador a nombre de quien lo pide. */
export class CreateTourUseCase {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly tours: TourRepository,
    private readonly storage: FileStorage,
    options: CreateTourOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  async execute(input: CreateTourInput): Promise<TourView> {
    const draft = {
      id: this.generateId(),
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      now: this.now(),
    };
    // Se valida todo antes de guardar la portada, para no dejar archivos sueltos.
    const withoutCover = Tour.create(draft);
    if (!input.cover) {
      await this.tours.save(withoutCover);
      return toTourView(withoutCover, this.storage);
    }

    const cover = await this.storage.save({
      content: input.cover,
      contentType: coverContentType(input.cover),
      folder: 'covers',
    });
    const tour = Tour.create({ ...draft, coverKey: cover.key });
    try {
      await this.tours.save(tour);
    } catch (error) {
      await this.storage.delete(cover.key);
      throw error;
    }
    return toTourView(tour, this.storage);
  }
}
