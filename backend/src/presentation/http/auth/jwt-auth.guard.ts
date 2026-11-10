import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../../application/auth/ports/token-service.js';
import { AuthenticationError } from '../../../domain/errors/domain-errors.js';
import { type AuthenticatedRequest, IS_PUBLIC_KEY } from './auth.decorators.js';

/**
 * Guard global: toda ruta exige un access token válido en la cabecera
 * Authorization: Bearer <token>, salvo las marcadas con @Public().
 *
 * En una ruta pública, si llega un token válido igual se identifica al
 * usuario (por ejemplo, para que el creador vea su borrador). Si el token no
 * es válido, la petición sigue como anónima.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    const hasToken = scheme === 'Bearer' && Boolean(token);

    if (isPublic) {
      if (hasToken) {
        request.user = await this.tokens
          .verifyAccessToken(token)
          .catch(() => undefined);
      }
      return true;
    }

    if (!hasToken) {
      throw new AuthenticationError('Debe iniciar sesión', 'NO_AUTENTICADO');
    }

    request.user = await this.tokens.verifyAccessToken(token);
    return true;
  }
}
