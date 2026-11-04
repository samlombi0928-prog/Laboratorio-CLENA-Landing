import type { RefreshSession } from '../../../domain/sessions/refresh-session.js';

export interface SessionRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  save(session: RefreshSession): Promise<void>;
  /** Revoca todas las sesiones activas del usuario. */
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SessionRepository');
