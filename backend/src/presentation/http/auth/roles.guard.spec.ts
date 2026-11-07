import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessDeniedError } from '../../../domain/errors/domain-errors.js';
import { Role } from '../../../domain/users/role.js';
import type { AuthenticatedUser } from './auth.decorators.js';
import { RolesGuard } from './roles.guard.js';

function createContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  function guardRequiring(roles: Role[] | undefined) {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
    return new RolesGuard(reflector);
  }

  it('deja pasar si la ruta no exige roles', () => {
    expect(guardRequiring(undefined).canActivate(createContext())).toBe(true);
    expect(guardRequiring([]).canActivate(createContext())).toBe(true);
  });

  it('deja pasar si el usuario tiene uno de los roles', () => {
    const guard = guardRequiring([Role.Admin, Role.Staff]);

    expect(
      guard.canActivate(createContext({ userId: 'u-1', role: Role.Staff })),
    ).toBe(true);
  });

  it('lanza AccessDeniedError si el rol no alcanza o no hay usuario', () => {
    const guard = guardRequiring([Role.Admin]);

    expect(() =>
      guard.canActivate(createContext({ userId: 'u-1', role: Role.Public })),
    ).toThrow(AccessDeniedError);
    expect(() => guard.canActivate(createContext())).toThrow(AccessDeniedError);
  });
});
