import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { DeleteAccountUseCase } from '../../../application/users/delete-account.use-case.js';
import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/auth.decorators.js';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_COOKIE_SETTINGS,
  type RefreshCookieSettings,
} from '../auth/auth.controller.js';
import { ErrorResponse } from '../errors/error-response.js';
import { DeleteAccountRequest } from './account.dto.js';

/** Intentos permitidos por minuto y por IP: la ruta comprueba una contraseña. */
const STRICT_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Cuenta')
@Controller('cuenta')
@UseGuards(ThrottlerGuard)
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    private readonly deleteAccount: DeleteAccountUseCase,
    @Inject(REFRESH_COOKIE_SETTINGS)
    private readonly cookieSettings: RefreshCookieSettings,
  ) {}

  @Delete()
  @Throttle(STRICT_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar mi cuenta y mis datos',
    description:
      'Derecho de supresión (Ley 1581 de 2012). Borra la cuenta, sus sesiones, sus recorridos con sus archivos y las inscripciones a eventos hechas con su correo. Las imágenes de la galería que subió se conservan, sin su nombre. No se puede deshacer, por eso pide la contraseña otra vez.',
  })
  @ApiNoContentResponse({ description: 'La cuenta se eliminó' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponse,
    description:
      'La contraseña no es correcta (CONTRASENA_INCORRECTA) o es la única cuenta de administrador (ULTIMO_ADMINISTRADOR)',
  })
  @ApiTooManyRequestsResponse({ type: ErrorResponse })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: DeleteAccountRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const result = await this.deleteAccount.execute(
      user.userId,
      body.contrasena,
    );

    // La cuenta ya no existe: el navegador no debe seguir con su sesión.
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.cookieSettings.secure,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
    });

    // Las claves son rutas con un uuid, no llevan datos personales.
    if (result.filesNotDeleted.length > 0) {
      this.logger.warn(
        `Se eliminó una cuenta, pero no se pudieron borrar estos archivos: ${result.filesNotDeleted.join(', ')}`,
      );
    }
  }
}
