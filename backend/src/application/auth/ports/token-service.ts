import type { Role } from '../../../domain/users/role.js';

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export interface IssuedAccessToken {
  token: string;
  expiresInSeconds: number;
}

export interface TokenService {
  issueAccessToken(payload: AccessTokenPayload): Promise<IssuedAccessToken>;
  /** Lanza AuthenticationError si el token es inválido o venció. */
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  /** Genera un refresh token aleatorio y opaco. */
  generateRefreshToken(): string;
  /** Hash con el que se guarda y se busca el refresh token. */
  hashRefreshToken(token: string): string;
}

export const TOKEN_SERVICE = Symbol('TokenService');
