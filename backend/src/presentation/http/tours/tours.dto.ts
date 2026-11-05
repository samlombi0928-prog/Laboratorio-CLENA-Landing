import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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
}

/** Formulario completo, solo para documentarlo en Swagger. */
export class CreateTourForm extends CreateTourRequest {
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
