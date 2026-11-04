import type { SessionRepository } from '../../src/application/auth/ports/session-repository.js';
import type { RefreshSession } from '../../src/domain/sessions/refresh-session.js';

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

  revokeAllForUser(userId: string, at: Date): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.revoke(at);
      }
    }
    return Promise.resolve();
  }
}
