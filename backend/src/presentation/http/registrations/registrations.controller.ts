import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { isUUID } from 'class-validator';
import { ListEventRegistrationsUseCase } from '../../../application/registrations/list-event-registrations.use-case.js';
import { RegisterForEventUseCase } from '../../../application/registrations/register-for-event.use-case.js';
import { ResourceNotFoundError } from '../../../domain/errors/domain-errors.js';
import { Role } from '../../../domain/users/role.js';
import { Public, Roles } from '../auth/auth.decorators.js';
import { ErrorResponse } from '../errors/error-response.js';
import {
  ListRegistrationsQuery,
  RegisterForEventRequest,
  RegistrationCreatedResponse,
  RegistrationPageResponse,
} from './registrations.dto.js';

// El formulario es público: se limita por IP para frenar inscripciones masivas.
const REGISTRATION_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Inscripciones')
@Controller('eventos/:id/inscripciones')
@UseGuards(ThrottlerGuard)
export class RegistrationsController {
  constructor(
    private readonly registerForEvent: RegisterForEventUseCase,
    private readonly listRegistrations: ListEventRegistrationsUseCase,
  ) {}

  @Public()
  @Throttle(REGISTRATION_THROTTLE)
  @Post()
  @ApiOperation({
    summary: 'Inscribirse a un evento',
    description:
      'No necesita cuenta. Exige aceptar el aviso de privacidad y envía un correo de confirmación.',
  })
  @ApiCreatedResponse({ type: RegistrationCreatedResponse })
  @ApiNotFoundResponse({
    type: ErrorResponse,
    description: 'El evento no existe o no está publicado',
  })
  @ApiConflictResponse({
    type: ErrorResponse,
    description:
      'El evento no tiene cupos (EVENTO_SIN_CUPOS) o el correo ya está inscrito (YA_INSCRITO)',
  })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponse,
    description: 'No aceptó el aviso de privacidad (CONSENTIMIENTO_REQUERIDO)',
  })
  @ApiTooManyRequestsResponse({ type: ErrorResponse })
  async register(
    @Param('id') eventId: string,
    @Body() body: RegisterForEventRequest,
  ): Promise<RegistrationCreatedResponse> {
    assertEventId(eventId);
    const result = await this.registerForEvent.execute({
      eventId,
      name: body.nombre,
      email: body.correo,
      acceptsPrivacyNotice: body.aceptaPrivacidad,
    });
    return RegistrationCreatedResponse.from(result);
  }

  @Roles(Role.Staff, Role.Admin)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ver los inscritos de un evento',
    description:
      'Solo para el personal del CLENA y el administrador. Paginado y con búsqueda por nombre o correo.',
  })
  @ApiOkResponse({ type: RegistrationPageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async list(
    @Param('id') eventId: string,
    @Query() query: ListRegistrationsQuery,
  ): Promise<RegistrationPageResponse> {
    assertEventId(eventId);
    const page = await this.listRegistrations.execute(eventId, {
      page: query.pagina,
      pageSize: query.tamano,
      search: query.buscar || undefined,
    });
    return RegistrationPageResponse.from(page);
  }
}

/** Un id que no es UUID no puede existir: responde 404 sin ir a la base de datos. */
function assertEventId(eventId: string): void {
  if (!isUUID(eventId)) {
    throw new ResourceNotFoundError('Evento', eventId);
  }
}
