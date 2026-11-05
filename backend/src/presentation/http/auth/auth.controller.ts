import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthResult } from '../../../application/auth/auth-result.js';
import { GetProfileUseCase } from '../../../application/auth/get-profile.use-case.js';
import { LogInUseCase } from '../../../application/auth/log-in.use-case.js';
import { LogOutUseCase } from '../../../application/auth/log-out.use-case.js';
import { RefreshSessionUseCase } from '../../../application/auth/refresh-session.use-case.js';
import { RegisterUserUseCase } from '../../../application/auth/register-user.use-case.js';
import { API_PREFIX } from '../api-prefix.js';
import { ErrorResponse } from '../errors/error-response.js';
import {
  type AuthenticatedUser,
  CurrentUser,
  Public,
} from './auth.decorators.js';
import {
  LoginRequest,
  RegisterRequest,
  SessionResponse,
  UserResponse,
} from './auth.dto.js';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = `/${API_PREFIX}/auth`;
export const REFRESH_COOKIE_SETTINGS = Symbol('RefreshCookieSettings');

export interface RefreshCookieSettings {
  /** true en producción: la cookie solo viaja por HTTPS. */
  secure: boolean;
}

/** Intentos permitidos por minuto y por IP en registro e inicio de sesión. */
const STRICT_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Autenticación')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly logIn: LogInUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly logOut: LogOutUseCase,
    private readonly getProfile: GetProfileUseCase,
    @Inject(REFRESH_COOKIE_SETTINGS)
    private readonly cookieSettings: RefreshCookieSettings,
  ) {}

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('registro')
  @ApiOperation({ summary: 'Crear una cuenta de creador' })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({
    type: ErrorResponse,
    description: 'El correo ya está registrado',
  })
  @ApiUnprocessableEntityResponse({
    type: ErrorResponse,
    description: 'No aceptó el aviso de privacidad',
  })
  @ApiTooManyRequestsResponse({ type: ErrorResponse })
  async register(@Body() body: RegisterRequest): Promise<UserResponse> {
    const user = await this.registerUser.execute({
      name: body.nombre,
      email: body.correo,
      password: body.contrasena,
      acceptsPrivacyNotice: body.aceptaPrivacidad,
    });
    return UserResponse.from(user);
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Devuelve el access token y deja el refresh token en una cookie httpOnly.',
  })
  @ApiOkResponse({ type: SessionResponse })
  @ApiUnauthorizedResponse({
    type: ErrorResponse,
    description: 'Correo o contraseña incorrectos',
  })
  @ApiTooManyRequestsResponse({ type: ErrorResponse })
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const result = await this.logIn.execute({
      email: body.correo,
      password: body.contrasena,
    });
    return this.startSession(response, result);
  }

  @Public()
  @Post('renovar')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiOperation({
    summary: 'Renovar la sesión',
    description:
      'Usa la cookie del refresh token y la cambia por una nueva (rotación).',
  })
  @ApiOkResponse({ type: SessionResponse })
  @ApiUnauthorizedResponse({
    type: ErrorResponse,
    description: 'La sesión venció o no es válida',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    try {
      const result = await this.refreshSession.execute(
        readRefreshCookie(request),
      );
      return this.startSession(response, result);
    } catch (error) {
      this.clearCookie(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiOperation({ summary: 'Cerrar la sesión de este dispositivo' })
  @ApiNoContentResponse()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logOut.execute(readRefreshCookie(request));
    this.clearCookie(response);
  }

  @Get('perfil')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario con sesión iniciada' })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async profile(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return UserResponse.from(await this.getProfile.execute(user.userId));
  }

  private startSession(
    response: Response,
    result: AuthResult,
  ): SessionResponse {
    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: this.cookieSettings.secure,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      expires: result.refreshTokenExpiresAt,
    });
    return SessionResponse.from(result);
  }

  private clearCookie(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.cookieSettings.secure,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
    });
  }
}

function readRefreshCookie(request: Request): string | undefined {
  const value: unknown = request.cookies?.[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
