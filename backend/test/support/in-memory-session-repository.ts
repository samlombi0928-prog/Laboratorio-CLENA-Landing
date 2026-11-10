import type { SessionRepository } from '../../src/application/auth/ports/session-repository.js';
import type { RefreshSession } from '../../src/domain/sessions/refresh-session.js';
import type { RevocationReason } from '../../src/domain/sessions/revocation-reason.js';

export class InMemorySessionRepository implements SessionRepository {
  readonly sessions = new Map<string, RefreshSession>();

  findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    const session = [...this.sessions.values()].find(
      (s) => s.tokenHash === tokenHash,
    );
    return Promise.resolve(session ?? null);
  }

  save(session: RefreshSession): Promise<void> {
    this.sessions.set(session.id, session);
    return Promise.resolve();
  }

  revokeIfActive(
    sessionId: string,
    at: Date,
    reason: RevocationReason,
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.isRevoked) {
      return Promise.resolve(false);
    }
    session.revoke(at, reason);
    return Promise.resolve(true);
  }

  revokeAllForUser(
    userId: string,
    at: Date,
    reason: RevocationReason,
  ): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.revoke(at, reason);
      }
    }
    return Promise.resolve();
  }
}
