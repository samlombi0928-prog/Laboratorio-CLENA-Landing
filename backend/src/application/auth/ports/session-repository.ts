import type { RefreshSession } from '../../../domain/sessions/refresh-session.js';
import type { RevocationReason } from '../../../domain/sessions/revocation-reason.js';

export interface SessionRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  save(session: RefreshSession): Promise<void>;
  /**
   * Revoca la sesión solo si sigue activa, en una sola operación. Devuelve
   * false si otra petición la revocó antes.
   */
  revokeIfActive(
    sessionId: string,
    at: Date,
    reason: RevocationReason,
  ): Promise<boolean>;
  /** Revoca todas las sesiones activas del usuario. */
  revokeAllForUser(
    userId: string,
    at: Date,
    reason: RevocationReason,
  ): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SessionRepository');
