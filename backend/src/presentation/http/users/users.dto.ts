import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { UserView } from '../../../application/auth/auth-result.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Page,
} from '../../../application/common/pagination.js';
import { Role, ROLES } from '../../../domain/users/role.js';
import { UserResponse } from '../auth/auth.dto.js';

/** Roles que el administrador puede asignar desde la aplicación. */
const ASSIGNABLE_ROLES = [Role.Staff, Role.Public];

/** Parámetros de la URL para listar usuarios, como en secciones y galería. */
export class ListUsersQuery {
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
    example: 'ana',
    description: 'Busca por nombre o correo',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(100, { message: 'La búsqueda puede tener máximo 100 caracteres' })
  buscar?: string;

  @ApiPropertyOptional({ enum: ROLES, description: 'Solo los de este rol' })
  @IsOptional()
  @IsIn(ROLES, { message: `El rol debe ser uno de: ${ROLES.join(', ')}` })
  rol?: Role;
}

export class ChangeRoleRequest {
  @ApiProperty({
    enum: ASSIGNABLE_ROLES,
    example: Role.Staff,
    description:
      '`staff` para nombrarlo personal del CLENA, `public` para retirarlo',
  })
  @IsIn(ASSIGNABLE_ROLES, {
    message: `El rol debe ser uno de: ${ASSIGNABLE_ROLES.join(', ')}`,
  })
  rol: Role;
}

export class UserPageResponse {
  @ApiProperty({ type: UserResponse, isArray: true })
  datos: UserResponse[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: DEFAULT_PAGE_SIZE })
  porPagina: number;

  @ApiProperty({
    example: 10,
    description:
      'Total de usuarios que cumplen el filtro, en todas las páginas',
  })
  total: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  static from(page: Page<UserView>): UserPageResponse {
    return {
      datos: page.items.map((user) => UserResponse.from(user)),
      pagina: page.page,
      porPagina: page.pageSize,
      total: page.total,
      totalPaginas: page.totalPages,
    };
  }
}
