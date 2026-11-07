import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessDeniedError } from '../../../domain/errors/domain-errors.js';
import type { Role } from '../../../domain/users/role.js';
import { type AuthenticatedRequest, ROLES_KEY } from './auth.decorators.js';

/** Guard global: si la ruta tiene @Roles(...), el usuario debe tener uno. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles || roles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !roles.includes(user.role)) {
      throw new AccessDeniedError();
    }
    return true;
  }
}
