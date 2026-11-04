import { AuthenticationError } from '../../domain/errors/domain-errors.js';
import type { UserRepository } from '../users/ports/user-repository.js';
import type { AuthResult } from './auth-result.js';
import type { SessionRepository } from './ports/session-repository.js';
import type { TokenService } from './ports/token-service.js';
import type { SessionIssuer } from './session-issuer.js';

function invalidSession(): AuthenticationError {
  return new AuthenticationError(
    'La sesión venció o no es válida. Inicie sesión de nuevo',
    'SESION_INVALIDA',
  );
}

/**
 * Cambia un refresh token por uno nuevo y un access token nuevo (rotación).
 * Si llega un refresh token que ya fue usado, puede ser robado: se cierran
 * todas las sesiones del usuario.
 */
export class RefreshSessionUseCase {
  private readonly now: () => Date;

  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    private readonly sessionIssuer: SessionIssuer,
    now?: () => Date,
  ) {
    this.now = now ?? (() => new Date());
  }

  async execute(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) {
      throw invalidSession();
    }

    const now = this.now();
    const session = await this.sessions.findByTokenHash(
      this.tokens.hashRefreshToken(refreshToken),
    );
    if (!session) {
      throw invalidSession();
    }

    if (session.isRevoked) {
      await this.sessions.revokeAllForUser(session.userId, now);
      throw invalidSession();
    }

    if (session.isExpired(now)) {
      throw invalidSession();
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      throw invalidSession();
    }

    session.revoke(now);
    await this.sessions.save(session);

    return this.sessionIssuer.issue(user);
  }
}
