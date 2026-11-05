import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import {
  CreateTourUseCase,
  MAX_COVER_BYTES,
} from '../../../application/tours/create-tour.use-case.js';
import { GetTourUseCase } from '../../../application/tours/get-tour.use-case.js';
import { ListMyToursUseCase } from '../../../application/tours/list-my-tours.use-case.js';
import { ResourceNotFoundError } from '../../../domain/errors/domain-errors.js';
import {
  type AuthenticatedUser,
  CurrentUser,
  Public,
} from '../auth/auth.decorators.js';
import { ErrorResponse } from '../errors/error-response.js';
import {
  CreateTourForm,
  CreateTourRequest,
  TourResponse,
} from './tours.dto.js';

/** Archivo que deja multer en memoria. Solo se usa su contenido. */
interface UploadedImage {
  buffer: Uint8Array;
}

@ApiTags('Recorridos')
@Controller('recorridos')
export class ToursController {
  constructor(
    private readonly createTour: CreateTourUseCase,
    private readonly listMyTours: ListMyToursUseCase,
    private readonly getTour: GetTourUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('portada', {
      limits: { fileSize: MAX_COVER_BYTES, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateTourForm })
  @ApiOperation({
    summary: 'Crear un recorrido',
    description:
      'Crea un recorrido en borrador a nombre del usuario. La portada es opcional.',
  })
  @ApiCreatedResponse({ type: TourResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiPayloadTooLargeResponse({
    type: ErrorResponse,
    description: 'La portada pesa más de 5 MB',
  })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponse,
    description: 'La portada no es JPG ni PNG',
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTourRequest,
    @UploadedFile() portada?: UploadedImage,
  ): Promise<TourResponse> {
    const tour = await this.createTour.execute({
      ownerId: user.userId,
      title: body.titulo,
      description: body.descripcion,
      cover: portada?.buffer,
    });
    return TourResponse.from(tour);
  }

  @Get('mios')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mis recorridos',
    description: 'Recorridos del usuario, incluidos los borradores.',
  })
  @ApiOkResponse({ type: TourResponse, isArray: true })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async listMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TourResponse[]> {
    const tours = await this.listMyTours.execute(user.userId);
    return tours.map((tour) => TourResponse.from(tour));
  }

  @Public()
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ver un recorrido',
    description:
      'Un recorrido publicado lo ve cualquiera; un borrador, solo su creador con sesión iniciada.',
  })
  @ApiOkResponse({ type: TourResponse })
  @ApiNotFoundResponse({
    type: ErrorResponse,
    description: 'No existe o es un borrador de otro usuario',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<TourResponse> {
    if (!isUUID(id)) {
      throw new ResourceNotFoundError('Recorrido', id);
    }
    const tour = await this.getTour.execute(id, user?.userId ?? null);
    return TourResponse.from(tour);
  }
}
