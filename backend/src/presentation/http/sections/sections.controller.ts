import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { CreateSectionItemUseCase } from '../../../application/sections/create-section-item.use-case.js';
import { DeleteSectionItemUseCase } from '../../../application/sections/delete-section-item.use-case.js';
import { ListSectionItemsUseCase } from '../../../application/sections/list-section-items.use-case.js';
import { UpdateSectionItemUseCase } from '../../../application/sections/update-section-item.use-case.js';
import { ResourceNotFoundError } from '../../../domain/errors/domain-errors.js';
import { Role } from '../../../domain/users/role.js';
import { Public, Roles } from '../auth/auth.decorators.js';
import { ErrorResponse } from '../errors/error-response.js';
import {
  CreateSectionItemRequest,
  ListSectionsQuery,
  SECTION_KIND_NAMES,
  SectionItemPageResponse,
  SectionItemResponse,
  UpdateSectionItemRequest,
} from './sections.dto.js';

/** Un id que no es UUID no puede existir: responde 404 como uno que no está. */
function checkId(id: string): void {
  if (!isUUID(id)) {
    throw new ResourceNotFoundError('Elemento de sección', id);
  }
}

@ApiTags('Secciones de la landing')
@Controller('secciones')
export class SectionsController {
  constructor(
    private readonly listItems: ListSectionItemsUseCase,
    private readonly createItem: CreateSectionItemUseCase,
    private readonly updateItem: UpdateSectionItemUseCase,
    private readonly deleteItem: DeleteSectionItemUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Ver las secciones de la landing',
    description:
      'Lista pública de espacios, servicios y horarios publicados, en el orden de la landing. Se puede filtrar por tipo.',
  })
  @ApiOkResponse({ type: SectionItemPageResponse })
  async listPublished(
    @Query() query: ListSectionsQuery,
  ): Promise<SectionItemPageResponse> {
    return this.list(query, true);
  }

  @Get('gestion')
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ver todas las secciones (panel)',
    description:
      'Solo el personal del CLENA y los administradores. Incluye los elementos que no están publicados.',
  })
  @ApiOkResponse({ type: SectionItemPageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  async listAll(
    @Query() query: ListSectionsQuery,
  ): Promise<SectionItemPageResponse> {
    return this.list(query, false);
  }

  @Post()
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agregar un espacio, servicio u horario',
    description: 'Solo el personal del CLENA y los administradores.',
  })
  @ApiCreatedResponse({ type: SectionItemResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiUnprocessableEntityResponse({ type: ErrorResponse })
  async create(
    @Body() body: CreateSectionItemRequest,
  ): Promise<SectionItemResponse> {
    const item = await this.createItem.execute({
      kind: SECTION_KIND_NAMES[body.tipo],
      title: body.titulo,
      description: body.descripcion,
      order: body.orden,
      published: body.publicado,
    });
    return SectionItemResponse.from(item);
  }

  @Patch(':id')
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar un elemento',
    description:
      'Solo el personal del CLENA y los administradores. Cambia solo los campos que se envían; el tipo no se puede cambiar.',
  })
  @ApiOkResponse({ type: SectionItemResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiUnprocessableEntityResponse({ type: ErrorResponse })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSectionItemRequest,
  ): Promise<SectionItemResponse> {
    checkId(id);
    const item = await this.updateItem.execute(id, {
      title: body.titulo,
      description: body.descripcion,
      order: body.orden,
      published: body.publicado,
    });
    return SectionItemResponse.from(item);
  }

  @Delete(':id')
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar un elemento',
    description: 'Solo el personal del CLENA y los administradores.',
  })
  @ApiNoContentResponse({ description: 'El elemento se eliminó' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async remove(@Param('id') id: string): Promise<void> {
    checkId(id);
    await this.deleteItem.execute(id);
  }

  private async list(
    query: ListSectionsQuery,
    onlyPublished: boolean,
  ): Promise<SectionItemPageResponse> {
    const page = await this.listItems.execute({
      kind: query.tipo ? SECTION_KIND_NAMES[query.tipo] : undefined,
      page: query.pagina,
      pageSize: query.porPagina,
      onlyPublished,
    });
    return SectionItemPageResponse.from(page);
  }
}
