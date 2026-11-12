import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { EventView } from '../../../application/events/event-view.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Page,
} from '../../../application/common/pagination.js';
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
} from '../../../domain/events/agenda-event.js';
import { EventStatus } from '../../../domain/events/event-status.js';

/** Nombre de cada estado en la API y el estado que representa. */
export const EVENT_STATUS_NAMES: Record<string, EventStatus> = {
  pendiente: EventStatus.Scheduled,
  publicado: EventStatus.Published,
  cerrado: EventStatus.Closed,
};

const STATUS_NAME_OF: Record<EventStatus, string> = {
  [EventStatus.Scheduled]: 'pendiente',
  [EventStatus.Published]: 'publicado',
  [EventStatus.Closed]: 'cerrado',
};

const STATUS_NAMES = Object.keys(EVENT_STATUS_NAMES);

/**
 * Fecha y hora ISO 8601 con zona horaria. Sin la zona, "19:00" sería la hora
 * del servidor y no la de Colombia.
 */
function IsDateTime(field: string) {
  return applyDecorators(
    IsISO8601(
      { strict: true },
      { message: `${field} debe ser una fecha y hora ISO 8601` },
    ),
    Matches(/(Z|[+-]\d{2}:\d{2})$/, {
      message: `${field} debe incluir la zona horaria, por ejemplo -05:00`,
    }),
  );
}

/** Parámetros de la URL para listar la agenda pública. */
export class ListEventsQuery {
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Busca en el título y el lugar',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(100, { message: 'La búsqueda puede tener máximo 100 caracteres' })
  buscar?: string;

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

/** Parámetros de la URL para listar los eventos en el panel. */
export class ListManagedEventsQuery extends ListEventsQuery {
  @ApiPropertyOptional({
    enum: STATUS_NAMES,
    description:
      'pendiente: todavía no se publica; publicado: se ve en la agenda; cerrado: ya no se ve',
  })
  @IsOptional()
  @IsIn(STATUS_NAMES, {
    message: `El estado debe ser uno de: ${STATUS_NAMES.join(', ')}`,
  })
  estado?: string;
}

/** Datos para programar un evento. */
export class CreateEventRequest {
  @ApiProperty({
    maxLength: EVENT_TITLE_MAX_LENGTH,
    example: 'Noche de jazz en la Aduana',
  })
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(EVENT_TITLE_MAX_LENGTH, {
    message: `El título puede tener máximo ${EVENT_TITLE_MAX_LENGTH} caracteres`,
  })
  titulo: string;

  @ApiPropertyOptional({
    maxLength: EVENT_DESCRIPTION_MAX_LENGTH,
    example: 'Concierto al aire libre en el patio central.',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(EVENT_DESCRIPTION_MAX_LENGTH, {
    message: `La descripción puede tener máximo ${EVENT_DESCRIPTION_MAX_LENGTH} caracteres`,
  })
  descripcion?: string;

  @ApiProperty({
    maxLength: EVENT_LOCATION_MAX_LENGTH,
    example: 'Patio central de la Aduana',
  })
  @IsString({ message: 'El lugar debe ser texto' })
  @IsNotEmpty({ message: 'El lugar es obligatorio' })
  @MaxLength(EVENT_LOCATION_MAX_LENGTH, {
    message: `El lugar puede tener máximo ${EVENT_LOCATION_MAX_LENGTH} caracteres`,
  })
  lugar: string;

  @ApiProperty({
    example: '2026-11-21T19:00:00-05:00',
    description: 'Fecha y hora de inicio, con zona horaria',
  })
  @IsDateTime('El inicio')
  inicio: string;

  @ApiProperty({ minimum: 1, example: 40 })
  @IsInt({ message: 'El cupo debe ser un número entero' })
  @Min(1, { message: 'El cupo debe ser mayor que cero' })
  cupo: number;

  @ApiProperty({
    example: '2026-11-11T00:00:00-05:00',
    description: 'Desde cuándo aparece en la agenda',
  })
  @IsDateTime('publicarDesde')
  publicarDesde: string;

  @ApiProperty({
    example: '2026-11-21T19:00:00-05:00',
    description:
      'Hasta cuándo aparece en la agenda. Igual sale de la agenda cuando el evento empieza.',
  })
  @IsDateTime('publicarHasta')
  publicarHasta: string;
}

/** Datos para editar: todos opcionales. */
export class UpdateEventRequest extends PartialType(CreateEventRequest) {}

export class EventResponse {
  @ApiProperty({ example: '5e7d2c10-4b1a-4f3e-9a6d-1c2b3a4d5e01' })
  id: string;

  @ApiProperty({ example: 'Noche de jazz en la Aduana' })
  titulo: string;

  @ApiProperty({ example: 'Concierto al aire libre en el patio central.' })
  descripcion: string;

  @ApiProperty({ example: 'Patio central de la Aduana' })
  lugar: string;

  @ApiProperty({ example: '2026-11-22T00:00:00.000Z' })
  inicio: Date;

  @ApiProperty({ example: 40 })
  cupo: number;

  @ApiProperty({ example: '2026-11-11T05:00:00.000Z' })
  publicarDesde: Date;

  @ApiProperty({ example: '2026-11-22T00:00:00.000Z' })
  publicarHasta: Date;

  @ApiProperty({ enum: STATUS_NAMES, example: 'publicado' })
  estado: string;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  actualizadoEn: Date;

  static from(event: EventView): EventResponse {
    return {
      id: event.id,
      titulo: event.title,
      descripcion: event.description,
      lugar: event.location,
      inicio: event.startsAt,
      cupo: event.capacity,
      publicarDesde: event.publishFrom,
      publicarHasta: event.publishUntil,
      estado: STATUS_NAME_OF[event.status],
      actualizadoEn: event.updatedAt,
    };
  }
}

export class EventPageResponse {
  @ApiProperty({ type: EventResponse, isArray: true })
  datos: EventResponse[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: DEFAULT_PAGE_SIZE })
  porPagina: number;

  @ApiProperty({
    example: 5,
    description: 'Total de eventos en todas las páginas',
  })
  total: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  static from(page: Page<EventView>): EventPageResponse {
    return {
      datos: page.items.map((event) => EventResponse.from(event)),
      pagina: page.page,
      porPagina: page.pageSize,
      total: page.total,
      totalPaginas: page.totalPages,
    };
  }
}
