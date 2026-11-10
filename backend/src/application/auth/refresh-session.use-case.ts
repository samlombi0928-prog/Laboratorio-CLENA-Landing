import {
  AuthenticationError,
  ConflictError,
} from '../../domain/errors/domain-errors.js';
import { RevocationReason } from '../../domain/sessions/revocation-reason.js';
import type { UserRepository } from '../users/ports/user-repository.js';
import type { AuthResult } from './auth-result.js';
import type { SessionRepository } from './ports/session-repository.js';
import type { TokenService } from './ports/token-service.js';
import type { SessionIssuer } from './session-issuer.js';

/**
 * Tiempo durante el cual un refresh token recién rotado no se trata como
 * robado. Cubre las pestañas que renuevan la sesión casi al mismo tiempo.
 */
export const REUSE_GRACE_PERIOD_MS = 10_000;

/** Código del error cuando otra petición ya renovó la misma sesión. */
export const SESSION_ALREADY_RENEWED = 'SESION_YA_RENOVADA';

function invalidSession(): AuthenticationError {
  return new AuthenticationError(
    'La sesión venció o no es válida. Inicie sesión de nuevo',
    'SESION_INVALIDA',
  );
}

function alreadyRenewed(): ConflictError {
  return new ConflictError(
    'La sesión ya se renovó en otra petición. Intente de nuevo',
    SESSION_ALREADY_RENEWED,
  );
}

/**
 * Cambia un refresh token por uno nuevo y un access token nuevo (rotación).
 *
 * Si llega un refresh token que ya fue usado, puede ser robado: se cierran
 * todas las sesiones del usuario. La excepción es un token rotado hace
 * menos de `REUSE_GRACE_PERIOD_MS`: casi siempre es otra pestaña que renovó
 * al mismo tiempo y ya tiene la cookie nueva, así que solo se rechaza esa
 * petición con `SESION_YA_RENOVADA`.
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
      if (session.wasRotatedWithin(now, REUSE_GRACE_PERIOD_MS)) {
        throw alreadyRenewed();
      }
      await this.sessions.revokeAllForUser(
        session.userId,
        now,
        RevocationReason.ReuseDetected,
      );
      throw invalidSession();
    }

    if (session.isExpired(now)) {
      throw invalidSession();
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      throw invalidSession();
    }

    // Si dos peticiones llegan con el mismo token, solo una logra revocarlo.
    const revoked = await this.sessions.revokeIfActive(
      session.id,
      now,
      RevocationReason.Rotated,
    );
    if (!revoked) {
      throw alreadyRenewed();
    }

    return this.sessionIssuer.issue(user);
  }
}
