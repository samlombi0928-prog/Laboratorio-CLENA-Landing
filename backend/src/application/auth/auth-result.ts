import type { Role } from '../../domain/users/role.js';
import type { User } from '../../domain/users/user.js';

/** Datos del usuario que se pueden mostrar: nunca incluye el hash. */
export interface UserView {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  user: UserView;
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
