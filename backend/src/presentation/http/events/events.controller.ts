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
import { CreateEventUseCase } from '../../../application/events/create-event.use-case.js';
import { DeleteEventUseCase } from '../../../application/events/delete-event.use-case.js';
import { ListEventsUseCase } from '../../../application/events/list-events.use-case.js';
import { UpdateEventUseCase } from '../../../application/events/update-event.use-case.js';
import { ResourceNotFoundError } from '../../../domain/errors/domain-errors.js';
import { Role } from '../../../domain/users/role.js';
import { Public, Roles } from '../auth/auth.decorators.js';
import { ErrorResponse } from '../errors/error-response.js';
import {
  CreateEventRequest,
  EVENT_STATUS_NAMES,
  EventPageResponse,
  EventResponse,
  ListEventsQuery,
  ListManagedEventsQuery,
  UpdateEventRequest,
} from './events.dto.js';

/** Un id que no es UUID no puede existir: responde 404 como uno que no está. */
function checkId(id: string): void {
  if (!isUUID(id)) {
    throw new ResourceNotFoundError('Evento', id);
  }
}

function toDate(value: string | undefined): Date | undefined {
  return value === undefined ? undefined : new Date(value);
}

@ApiTags('Agenda de eventos')
@Controller('eventos')
export class EventsController {
  constructor(
    private readonly listEvents: ListEventsUseCase,
    private readonly createEvent: CreateEventUseCase,
    private readonly updateEvent: UpdateEventUseCase,
    private readonly deleteEvent: DeleteEventUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Ver la agenda',
    description:
      'Lista pública de los eventos que están en su periodo de publicación y todavía no empiezan, del más próximo al más lejano. Se puede buscar por título o lugar.',
  })
  @ApiOkResponse({ type: EventPageResponse })
  async listPublished(
    @Query() query: ListEventsQuery,
  ): Promise<EventPageResponse> {
    const page = await this.listEvents.execute({
      onlyPublished: true,
      search: query.buscar,
      page: query.pagina,
      pageSize: query.porPagina,
    });
    return EventPageResponse.from(page);
  }

  @Get('gestion')
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ver todos los eventos (panel)',
    description:
      'Solo el personal del CLENA y los administradores. Incluye los pendientes y los cerrados; se puede filtrar por estado.',
  })
  @ApiOkResponse({ type: EventPageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  async listAll(
    @Query() query: ListManagedEventsQuery,
  ): Promise<EventPageResponse> {
    const page = await this.listEvents.execute({
      onlyPublished: false,
      status: query.estado ? EVENT_STATUS_NAMES[query.estado] : undefined,
      search: query.buscar,
      page: query.pagina,
      pageSize: query.porPagina,
    });
    return EventPageResponse.from(page);
  }

  @Post()
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Programar un evento',
    description:
      'Solo el personal del CLENA y los administradores. El evento aparece en la agenda desde publicarDesde hasta publicarHasta, o hasta que empiece.',
  })
  @ApiCreatedResponse({ type: EventResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponse,
    description:
      'El fin de la publicación es anterior a su inicio (PERIODO_DE_PUBLICACION_NO_VALIDO)',
  })
  async create(@Body() body: CreateEventRequest): Promise<EventResponse> {
    const event = await this.createEvent.execute({
      title: body.titulo,
      description: body.descripcion,
      location: body.lugar,
      startsAt: new Date(body.inicio),
      capacity: body.cupo,
      publishFrom: new Date(body.publicarDesde),
      publishUntil: new Date(body.publicarHasta),
    });
    return EventResponse.from(event);
  }

  @Patch(':id')
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar un evento',
    description:
      'Solo el personal del CLENA y los administradores. Cambia solo los campos que se envían.',
  })
  @ApiOkResponse({ type: EventResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @ApiUnprocessableEntityResponse({ type: ErrorResponse })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateEventRequest,
  ): Promise<EventResponse> {
    checkId(id);
    const event = await this.updateEvent.execute(id, {
      title: body.titulo,
      description: body.descripcion,
      location: body.lugar,
      startsAt: toDate(body.inicio),
      capacity: body.cupo,
      publishFrom: toDate(body.publicarDesde),
      publishUntil: toDate(body.publicarHasta),
    });
    return EventResponse.from(event);
  }

  @Delete(':id')
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar un evento',
    description:
      'Solo el personal del CLENA y los administradores. También borra sus inscripciones.',
  })
  @ApiNoContentResponse({ description: 'El evento se eliminó' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async remove(@Param('id') id: string): Promise<void> {
    checkId(id);
    await this.deleteEvent.execute(id);
  }
}
