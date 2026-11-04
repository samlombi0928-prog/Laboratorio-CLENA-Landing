import { randomUUID } from 'node:crypto';
import { RefreshSession } from '../../domain/sessions/refresh-session.js';
import type { User } from '../../domain/users/user.js';
import { type AuthResult, toUserView } from './auth-result.js';
import type { SessionRepository } from './ports/session-repository.js';
import type { TokenService } from './ports/token-service.js';

export interface SessionIssuerOptions {
  refreshTokenTtlMs: number;
  now?: () => Date;
  generateId?: () => string;
}

/**
 * Abre una sesión nueva para un usuario: guarda el hash de un refresh token
 * nuevo y firma un access token. Lo usan el login y la renovación.
 */
export class SessionIssuer {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    private readonly options: SessionIssuerOptions,
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  async issue(user: User): Promise<AuthResult> {
    const refreshToken = this.tokens.generateRefreshToken();
    const session = RefreshSession.start({
      id: this.generateId(),
      userId: user.id,
      tokenHash: this.tokens.hashRefreshToken(refreshToken),
      now: this.now(),
      ttlMs: this.options.refreshTokenTtlMs,
    });
    await this.sessions.save(session);

    const accessToken = await this.tokens.issueAccessToken({
      userId: user.id,
      role: user.role,
    });

    return {
      user: toUserView(user),
      accessToken: accessToken.token,
      accessTokenExpiresInSeconds: accessToken.expiresInSeconds,
      refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }
}
