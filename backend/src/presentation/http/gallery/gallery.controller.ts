import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { DeleteGalleryImageUseCase } from '../../../application/gallery/delete-gallery-image.use-case.js';
import { ListGalleryImagesUseCase } from '../../../application/gallery/list-gallery-images.use-case.js';
import {
  MAX_GALLERY_IMAGE_BYTES,
  UploadGalleryImageUseCase,
} from '../../../application/gallery/upload-gallery-image.use-case.js';
import { ResourceNotFoundError } from '../../../domain/errors/domain-errors.js';
import { Role } from '../../../domain/users/role.js';
import {
  type AuthenticatedUser,
  CurrentUser,
  Public,
  Roles,
} from '../auth/auth.decorators.js';
import { ErrorResponse } from '../errors/error-response.js';
import {
  GALLERY_ORDERS,
  GalleryImageResponse,
  GalleryPageResponse,
  ListGalleryQuery,
  UploadGalleryImageForm,
  UploadGalleryImageRequest,
} from './gallery.dto.js';

/** Archivo que deja multer en memoria. Solo se usa su contenido. */
interface UploadedImage {
  buffer: Uint8Array;
}

@ApiTags('Galería')
@Controller('galeria')
export class GalleryController {
  constructor(
    private readonly uploadImage: UploadGalleryImageUseCase,
    private readonly listImages: ListGalleryImagesUseCase,
    private readonly deleteImage: DeleteGalleryImageUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Ver la galería',
    description:
      'Lista pública de imágenes, paginada. Se puede ordenar por fecha y buscar por título.',
  })
  @ApiOkResponse({ type: GalleryPageResponse })
  async list(@Query() query: ListGalleryQuery): Promise<GalleryPageResponse> {
    const page = await this.listImages.execute({
      page: query.pagina,
      pageSize: query.porPagina,
      order: query.orden ? GALLERY_ORDERS[query.orden] : undefined,
      search: query.buscar,
    });
    return GalleryPageResponse.from(page);
  }

  @Post()
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('imagen', {
      limits: { fileSize: MAX_GALLERY_IMAGE_BYTES, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadGalleryImageForm })
  @ApiOperation({
    summary: 'Subir una imagen a la galería',
    description:
      'Solo el personal del CLENA y los administradores. JPG o PNG de máximo 10 MB, con título y texto alternativo.',
  })
  @ApiCreatedResponse({ type: GalleryImageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({
    type: ErrorResponse,
    description: 'La cuenta no es de personal ni de administración',
  })
  @ApiPayloadTooLargeResponse({
    type: ErrorResponse,
    description: 'La imagen pesa más de 10 MB',
  })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponse,
    description: 'Falta la imagen o no es JPG ni PNG',
  })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UploadGalleryImageRequest,
    @UploadedFile() imagen?: UploadedImage,
  ): Promise<GalleryImageResponse> {
    const image = await this.uploadImage.execute({
      uploadedBy: user.userId,
      title: body.titulo,
      altText: body.textoAlternativo,
      image: imagen?.buffer,
    });
    return GalleryImageResponse.from(image);
  }

  @Delete(':id')
  @Roles(Role.Staff, Role.Admin)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Eliminar una imagen de la galería',
    description:
      'Solo el personal del CLENA y los administradores. Elimina la imagen de la galería y su archivo del almacenamiento.',
  })
  @ApiNoContentResponse({ description: 'La imagen se eliminó' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async remove(@Param('id') id: string): Promise<void> {
    if (!isUUID(id)) {
      throw new ResourceNotFoundError('Imagen', id);
    }
    await this.deleteImage.execute(id);
  }
}
