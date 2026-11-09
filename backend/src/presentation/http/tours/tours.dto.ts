import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  Max,
  Min,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Page,
} from '../../../application/common/pagination.js';
import type { TourView } from '../../../application/tours/tour-view.js';
import {
  TOUR_DESCRIPTION_MAX_LENGTH,
  TOUR_TITLE_MAX_LENGTH,
} from '../../../domain/tours/tour.js';
import { TourStatus } from '../../../domain/tours/tour-status.js';

/** Campos de texto del formulario para crear un recorrido. */
export class CreateTourRequest {
  @ApiProperty({
    example: 'La Aduana de Barranquilla',
    maxLength: TOUR_TITLE_MAX_LENGTH,
  })
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(TOUR_TITLE_MAX_LENGTH, {
    message: `El título puede tener máximo ${TOUR_TITLE_MAX_LENGTH} caracteres`,
  })
  titulo: string;

  @ApiPropertyOptional({
    example: 'Un recorrido por el edificio y su historia.',
    maxLength: TOUR_DESCRIPTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(TOUR_DESCRIPTION_MAX_LENGTH, {
    message: `La descripción puede tener máximo ${TOUR_DESCRIPTION_MAX_LENGTH} caracteres`,
  })
  descripcion?: string;

  /**
   * El archivo llega aparte, por multer. Swagger y algunos formularios envían
   * "portada" como texto vacío cuando no se elige archivo: se acepta y se
   * ignora. Cualquier otro texto se rechaza.
   */
  @IsOptional()
  @IsIn([''], { message: 'La portada debe enviarse como archivo' })
  portada?: string;
}

/** Formulario completo, solo para documentarlo en Swagger. */
export class CreateTourForm extends OmitType(CreateTourRequest, [
  'portada',
] as const) {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Imagen de portada, JPG o PNG de máximo 5 MB',
  })
  portada?: unknown;
}

export class TourResponse {
  @ApiProperty({ example: '7d0c2f4e-1b9a-4f3e-8c2d-5a6b7c8d9e0f' })
  id: string;

  @ApiProperty({ example: 'La Aduana de Barranquilla' })
  titulo: string;

  @ApiProperty({ example: 'Un recorrido por el edificio y su historia.' })
  descripcion: string;

  @ApiProperty({ enum: TourStatus, example: TourStatus.Draft })
  estado: TourStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/archivos/covers/7d0c2f4e.jpg',
  })
  portadaUrl: string | null;

  @ApiProperty({ example: '2026-11-05T12:00:00.000Z' })
  creadoEn: Date;

  @ApiProperty({ example: '2026-11-05T12:00:00.000Z' })
  actualizadoEn: Date;

  static from(tour: TourView): TourResponse {
    return {
      id: tour.id,
      titulo: tour.title,
      descripcion: tour.description,
      estado: tour.status,
      portadaUrl: tour.coverUrl,
      creadoEn: tour.createdAt,
      actualizadoEn: tour.updatedAt,
    };
  }
}

/** Parámetros de la URL para "Mis recorridos", como en secciones y galería. */
export class ListMyToursQuery {
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
}

export class TourPageResponse {
  @ApiProperty({ type: TourResponse, isArray: true })
  datos: TourResponse[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: DEFAULT_PAGE_SIZE })
  porPagina: number;

  @ApiProperty({
    example: 3,
    description: 'Total de recorridos del usuario, en todas las páginas',
  })
  total: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  static from(page: Page<TourView>): TourPageResponse {
    return {
      datos: page.items.map((tour) => TourResponse.from(tour)),
      pagina: page.page,
      porPagina: page.pageSize,
      total: page.total,
      totalPaginas: page.totalPages,
    };
  }
}
