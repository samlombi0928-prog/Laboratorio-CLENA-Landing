import { BusinessRuleError } from '../errors/domain-errors.js';

export const GALLERY_TITLE_MAX_LENGTH = 120;
export const GALLERY_ALT_TEXT_MAX_LENGTH = 250;

export interface GalleryImageProps {
  id: string;
  title: string;
  /** Descripción de la imagen para lectores de pantalla y para cuando no carga. */
  altText: string;
  /** Clave del archivo en el almacenamiento, por ejemplo gallery/<uuid>.jpg. */
  imageKey: string;
  /**
   * Quien la subió. Es null si esa cuenta se eliminó (#16): la imagen es
   * contenido del CLENA y se queda, pero ya no apunta a una persona.
   */
  uploadedBy: string | null;
  createdAt: Date;
}

export interface CreateGalleryImageProps {
  id: string;
  title: string;
  altText: string;
  imageKey: string;
  uploadedBy: string;
  now: Date;
}

export interface GalleryText {
  title: string;
  altText: string;
}

/**
 * Valida y limpia el título y el texto alternativo. Se expone aparte para que
 * el caso de uso pueda validarlos ANTES de guardar el archivo en disco y no
 * dejar archivos sueltos si el texto es inválido.
 */
export function validateGalleryText(input: GalleryText): GalleryText {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new BusinessRuleError(
      'El título de la imagen es obligatorio',
      'TITULO_REQUERIDO',
    );
  }
  if (title.length > GALLERY_TITLE_MAX_LENGTH) {
    throw new BusinessRuleError(
      `El título puede tener máximo ${GALLERY_TITLE_MAX_LENGTH} caracteres`,
      'TITULO_DEMASIADO_LARGO',
    );
  }

  const altText = input.altText.trim();
  if (altText.length === 0) {
    throw new BusinessRuleError(
      'El texto alternativo es obligatorio',
      'TEXTO_ALTERNATIVO_REQUERIDO',
    );
  }
  if (altText.length > GALLERY_ALT_TEXT_MAX_LENGTH) {
    throw new BusinessRuleError(
      `El texto alternativo puede tener máximo ${GALLERY_ALT_TEXT_MAX_LENGTH} caracteres`,
      'TEXTO_ALTERNATIVO_DEMASIADO_LARGO',
    );
  }

  return { title, altText };
}

/** Imagen de la galería pública del CLENA, subida por su personal. */
export class GalleryImage {
  private constructor(private readonly props: GalleryImageProps) {}

  static create(input: CreateGalleryImageProps): GalleryImage {
    const { title, altText } = validateGalleryText(input);
    return new GalleryImage({
      id: input.id,
      title,
      altText,
      imageKey: input.imageKey,
      uploadedBy: input.uploadedBy,
      createdAt: input.now,
    });
  }

  /** Reconstruye una imagen que ya existe, por ejemplo desde la base de datos. */
  static restore(props: GalleryImageProps): GalleryImage {
    return new GalleryImage({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get altText(): string {
    return this.props.altText;
  }

  get imageKey(): string {
    return this.props.imageKey;
  }

  get uploadedBy(): string | null {
    return this.props.uploadedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
