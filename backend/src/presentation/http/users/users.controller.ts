import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { ChangeUserRoleUseCase } from '../../../application/users/change-user-role.use-case.js';
import { ListUsersUseCase } from '../../../application/users/list-users.use-case.js';
import { ResourceNotFoundError } from '../../../domain/errors/domain-errors.js';
import { Role } from '../../../domain/users/role.js';
import { UserResponse } from '../auth/auth.dto.js';
import { Roles } from '../auth/auth.decorators.js';
import { ErrorResponse } from '../errors/error-response.js';
import {
  ChangeRoleRequest,
  ListUsersQuery,
  UserPageResponse,
} from './users.dto.js';

/** Gestión de roles: solo el administrador. */
@ApiTags('Usuarios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponse })
@ApiForbiddenResponse({
  type: ErrorResponse,
  description: 'Solo el administrador',
})
@Roles(Role.Admin)
@Controller('usuarios')
export class UsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly changeUserRole: ChangeUserRoleUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'Paginado (pagina, porPagina), con búsqueda por nombre o correo (buscar) y filtro por rol (rol).',
  })
  @ApiOkResponse({ type: UserPageResponse })
  async list(@Query() query: ListUsersQuery): Promise<UserPageResponse> {
    const page = await this.listUsers.execute({
      page: query.pagina,
      pageSize: query.porPagina,
      search: query.buscar || undefined,
      role: query.rol,
    });
    return UserPageResponse.from(page);
  }

  @Patch(':id/rol')
  @ApiOperation({
    summary: 'Cambiar el rol de un usuario',
    description:
      'Nombra personal del CLENA (`staff`) o lo retira (`public`). El usuario ve el cambio en la próxima renovación de su sesión, en máximo 15 minutos o al recargar la página.',
  })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponse,
    description: 'El usuario es administrador (ROL_DE_ADMINISTRADOR)',
  })
  async changeRole(
    @Param('id') id: string,
    @Body() body: ChangeRoleRequest,
  ): Promise<UserResponse> {
    if (!isUUID(id)) {
      throw new ResourceNotFoundError('Usuario', id);
    }
    const user = await this.changeUserRole.execute(id, body.rol);
    return UserResponse.from(user);
  }
}
