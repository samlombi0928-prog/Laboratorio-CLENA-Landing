import { createHash, randomBytes } from 'node:crypto';
import type { JwtService } from '@nestjs/jwt';
import type {
  AccessTokenPayload,
  IssuedAccessToken,
  TokenService,
} from '../../application/auth/ports/token-service.js';
import { AuthenticationError } from '../../domain/errors/domain-errors.js';
import { ROLES, type Role } from '../../domain/users/role.js';

export interface JwtTokenServiceOptions {
  accessSecret: string;
  accessTtlSeconds: number;
}

interface JwtClaims {
  sub?: unknown;
  role?: unknown;
}

/**
 * Access tokens: JWT firmados con HS256 y de vida corta.
 * Refresh tokens: 32 bytes aleatorios; en la base de datos solo se guarda su
 * SHA-256, así que una copia de la base no permite abrir sesiones.
 */
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly options: JwtTokenServiceOptions,
  ) {}

  async issueAccessToken(
    payload: AccessTokenPayload,
  ): Promise<IssuedAccessToken> {
    const token = await this.jwt.signAsync(
      { sub: payload.userId, role: payload.role },
      {
        secret: this.options.accessSecret,
        expiresIn: this.options.accessTtlSeconds,
        algorithm: 'HS256',
      },
    );
    return { token, expiresInSeconds: this.options.accessTtlSeconds };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    let claims: JwtClaims;
    try {
      claims = await this.jwt.verifyAsync<JwtClaims>(token, {
        secret: this.options.accessSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw invalidToken();
    }

    if (
      typeof claims.sub !== 'string' ||
      !ROLES.includes(claims.role as Role)
    ) {
      throw invalidToken();
    }
    return { userId: claims.sub, role: claims.role as Role };
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

function invalidToken(): AuthenticationError {
  return new AuthenticationError(
    'El token de acceso venció o no es válido',
    'TOKEN_INVALIDO',
  );
}
