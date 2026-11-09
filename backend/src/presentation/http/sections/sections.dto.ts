import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  OmitType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Page,
} from '../../../application/common/pagination.js';
import {
  SECTION_DESCRIPTION_MAX_LENGTH,
  SECTION_ORDER_MAX,
  SECTION_TITLE_MAX_LENGTH,
  type SectionItem,
  SectionKind,
} from '../../../domain/sections/section-item.js';

/** Nombre de cada sección en la API y el tipo que representa. */
export const SECTION_KIND_NAMES: Record<string, SectionKind> = {
  espacio: SectionKind.Space,
  servicio: SectionKind.Service,
  horario: SectionKind.Schedule,
};

const KIND_NAME_OF: Record<SectionKind, string> = {
  [SectionKind.Space]: 'espacio',
  [SectionKind.Service]: 'servicio',
  [SectionKind.Schedule]: 'horario',
};

const KIND_NAMES = Object.keys(SECTION_KIND_NAMES);

/** Parámetros de la URL para listar las secciones. */
export class ListSectionsQuery {
  @ApiPropertyOptional({
    enum: KIND_NAMES,
    description: 'Solo los de esta sección',
  })
  @IsOptional()
  @IsIn(KIND_NAMES, {
    message: `El tipo debe ser uno de: ${KIND_NAMES.join(', ')}`,
  })
  tipo?: string;

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

/** Datos para crear un elemento de una sección. */
export class CreateSectionItemRequest {
  @ApiProperty({ enum: KIND_NAMES, example: 'servicio' })
  @IsIn(KIND_NAMES, {
    message: `El tipo debe ser uno de: ${KIND_NAMES.join(', ')}`,
  })
  tipo: string;

  @ApiProperty({
    maxLength: SECTION_TITLE_MAX_LENGTH,
    example: 'Visitas guiadas',
  })
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(SECTION_TITLE_MAX_LENGTH, {
    message: `El título puede tener máximo ${SECTION_TITLE_MAX_LENGTH} caracteres`,
  })
  titulo: string;

  @ApiProperty({
    maxLength: SECTION_DESCRIPTION_MAX_LENGTH,
    example: 'Recorridos por el edificio para grupos.',
  })
  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(SECTION_DESCRIPTION_MAX_LENGTH, {
    message: `La descripción puede tener máximo ${SECTION_DESCRIPTION_MAX_LENGTH} caracteres`,
  })
  descripcion: string;

  @ApiPropertyOptional({ minimum: 0, maximum: SECTION_ORDER_MAX, default: 0 })
  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden debe ser 0 o mayor' })
  @Max(SECTION_ORDER_MAX, {
    message: `El orden puede ser máximo ${SECTION_ORDER_MAX}`,
  })
  orden?: number;

  @ApiPropertyOptional({ default: true, description: 'Si se ve en la landing' })
  @IsOptional()
  @IsBoolean({ message: 'Publicado debe ser verdadero o falso' })
  publicado?: boolean;
}

/** Datos para editar: todos opcionales y sin el tipo, que no se cambia. */
export class UpdateSectionItemRequest extends PartialType(
  OmitType(CreateSectionItemRequest, ['tipo'] as const),
) {}

export class SectionItemResponse {
  @ApiProperty({ example: '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b08' })
  id: string;

  @ApiProperty({ enum: KIND_NAMES, example: 'servicio' })
  tipo: string;

  @ApiProperty({ example: 'Visitas guiadas' })
  titulo: string;

  @ApiProperty({ example: 'Recorridos por el edificio para grupos.' })
  descripcion: string;

  @ApiProperty({ example: 3 })
  orden: number;

  @ApiProperty({ example: true })
  publicado: boolean;

  @ApiProperty({ example: '2026-11-07T12:00:00.000Z' })
  actualizadoEn: Date;

  static from(item: SectionItem): SectionItemResponse {
    return {
      id: item.id,
      tipo: KIND_NAME_OF[item.kind],
      titulo: item.title,
      descripcion: item.description,
      orden: item.order,
      publicado: item.published,
      actualizadoEn: item.updatedAt,
    };
  }
}

export class SectionItemPageResponse {
  @ApiProperty({ type: SectionItemResponse, isArray: true })
  datos: SectionItemResponse[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: DEFAULT_PAGE_SIZE })
  porPagina: number;

  @ApiProperty({
    example: 10,
    description: 'Total de elementos en todas las páginas',
  })
  total: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  static from(page: Page<SectionItem>): SectionItemPageResponse {
    return {
      datos: page.items.map((item) => SectionItemResponse.from(item)),
      pagina: page.page,
      porPagina: page.pageSize,
      total: page.total,
      totalPaginas: page.totalPages,
    };
  }
}
