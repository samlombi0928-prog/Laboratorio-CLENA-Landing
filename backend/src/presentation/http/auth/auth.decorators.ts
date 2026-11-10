import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AccessTokenPayload } from '../../../application/auth/ports/token-service.js';
import type { Role } from '../../../domain/users/role.js';

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ROLES_KEY = 'auth:roles';

/** Usuario autenticado que el guard de JWT deja en la petición. */
export type AuthenticatedUser = AccessTokenPayload;

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/** Marca una ruta como accesible sin sesión. Todas las demás la exigen. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe una ruta a ciertos roles, por ejemplo @Roles(Role.Admin). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Inyecta en el controlador el usuario autenticado. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
