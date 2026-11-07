import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const MAX_PAGE_SIZE = 100;

/** Parámetros de paginación de cualquier listado: ?pagina=1&tamano=20 */
export class PaginationQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser 1 o mayor' })
  pagina = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero' })
  @Min(1, { message: 'El tamaño de página debe ser 1 o mayor' })
  @Max(MAX_PAGE_SIZE, {
    message: `El tamaño de página puede ser máximo ${MAX_PAGE_SIZE}`,
  })
  tamano = 20;
}

/** Campos de paginación que acompañan a los elementos de un listado. */
export class PageInfo {
  @ApiProperty({
    example: 42,
    description: 'Total de elementos en todas las páginas',
  })
  total: number;

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 20 })
  tamano: number;
}
