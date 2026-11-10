import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { GalleryImageView } from '../../../application/gallery/gallery-image-view.js';
import type { GalleryOrder } from '../../../application/gallery/ports/gallery-image-repository.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Page,
} from '../../../application/common/pagination.js';
import {
  GALLERY_ALT_TEXT_MAX_LENGTH,
  GALLERY_TITLE_MAX_LENGTH,
} from '../../../domain/gallery/gallery-image.js';

/** Valores de "orden" en la URL y el orden que representan. */
export const GALLERY_ORDERS: Record<string, GalleryOrder> = {
  recientes: 'newest',
  antiguas: 'oldest',
};

/** Parámetros de la URL para listar la galería. */
export class ListGalleryQuery {
  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser 1 o mayor' })
  pagina?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    example: DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero' })
  @Min(1, { message: 'El tamaño de página debe ser 1 o mayor' })
  @Max(MAX_PAGE_SIZE, {
    message: `El tamaño de página puede ser máximo ${MAX_PAGE_SIZE}`,
  })
  porPagina?: number;

  @ApiPropertyOptional({
    enum: Object.keys(GALLERY_ORDERS),
    default: 'recientes',
    description: 'Orden por fecha de subida',
  })
  @IsOptional()
  @IsIn(Object.keys(GALLERY_ORDERS), {
    message: `El orden debe ser uno de: ${Object.keys(GALLERY_ORDERS).join(', ')}`,
  })
  orden?: string;

  @ApiPropertyOptional({
    maxLength: GALLERY_TITLE_MAX_LENGTH,
    description: 'Texto que debe contener el título',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(GALLERY_TITLE_MAX_LENGTH, {
    message: `La búsqueda puede tener máximo ${GALLERY_TITLE_MAX_LENGTH} caracteres`,
  })
  buscar?: string;
}

/** Campos de texto del formulario para subir una imagen. */
export class UploadGalleryImageRequest {
  @ApiProperty({
    example: 'Fachada de la Aduana',
    maxLength: GALLERY_TITLE_MAX_LENGTH,
  })
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(GALLERY_TITLE_MAX_LENGTH, {
    message: `El título puede tener máximo ${GALLERY_TITLE_MAX_LENGTH} caracteres`,
  })
  titulo: string;

  @ApiProperty({
    example: 'Fachada de ladrillo de la antigua Aduana vista desde la plaza',
    maxLength: GALLERY_ALT_TEXT_MAX_LENGTH,
    description: 'Descripción de la imagen para lectores de pantalla',
  })
  @IsString({ message: 'El texto alternativo debe ser texto' })
  @IsNotEmpty({ message: 'El texto alternativo es obligatorio' })
  @MaxLength(GALLERY_ALT_TEXT_MAX_LENGTH, {
    message: `El texto alternativo puede tener máximo ${GALLERY_ALT_TEXT_MAX_LENGTH} caracteres`,
  })
  textoAlternativo: string;

  /**
   * El archivo llega aparte, por multer. Swagger y algunos formularios envían
   * "imagen" como texto vacío cuando no se elige archivo: se acepta y se
   * ignora, y el caso de uso responde que falta la imagen. Cualquier otro
   * texto se rechaza.
   */
  @IsOptional()
  @IsIn([''], { message: 'La imagen debe enviarse como archivo' })
  imagen?: string;
}

/** Formulario completo, solo para documentarlo en Swagger. */
export class UploadGalleryImageForm extends OmitType(
  UploadGalleryImageRequest,
  ['imagen'] as const,
) {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Imagen JPG o PNG de máximo 10 MB',
  })
  imagen: unknown;
}

export class GalleryImageResponse {
  @ApiProperty({ example: '7d0c2f4e-1b9a-4f3e-8c2d-5a6b7c8d9e0f' })
  id: string;

  @ApiProperty({ example: 'Fachada de la Aduana' })
  titulo: string;

  @ApiProperty({
    example: 'Fachada de ladrillo de la antigua Aduana vista desde la plaza',
  })
  textoAlternativo: string;

  @ApiProperty({
    example:
      'http://localhost:3000/archivos/gallery/7d0c2f4e-1b9a-4f3e-8c2d-5a6b7c8d9e0f.jpg',
  })
  imagenUrl: string;

  @ApiProperty({ example: '2026-11-07T12:00:00.000Z' })
  creadoEn: Date;

  static from(image: GalleryImageView): GalleryImageResponse {
    return {
      id: image.id,
      titulo: image.title,
      textoAlternativo: image.altText,
      imagenUrl: image.imageUrl,
      creadoEn: image.createdAt,
    };
  }
}

export class GalleryPageResponse {
  @ApiProperty({ type: GalleryImageResponse, isArray: true })
  datos: GalleryImageResponse[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: DEFAULT_PAGE_SIZE })
  porPagina: number;

  @ApiProperty({
    example: 25,
    description: 'Total de imágenes en todas las páginas',
  })
  total: number;

  @ApiProperty({ example: 3 })
  totalPaginas: number;

  static from(page: Page<GalleryImageView>): GalleryPageResponse {
    return {
      datos: page.items.map((image) => GalleryImageResponse.from(image)),
      pagina: page.page,
      porPagina: page.pageSize,
      total: page.total,
      totalPaginas: page.totalPages,
    };
  }
}
