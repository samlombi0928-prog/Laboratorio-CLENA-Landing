import { IsNull, type Repository } from 'typeorm';
import type { SessionRepository } from '../../application/auth/ports/session-repository.js';
import type { RefreshSession } from '../../domain/sessions/refresh-session.js';
import type { RevocationReason } from '../../domain/sessions/revocation-reason.js';
import { RefreshSessionMapper } from './refresh-session.mapper.js';
import type { RefreshSessionOrmEntity } from './refresh-session.orm-entity.js';

export class TypeOrmSessionRepository implements SessionRepository {
  constructor(
    private readonly repository: Repository<RefreshSessionOrmEntity>,
  ) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    const row = await this.repository.findOneBy({ tokenHash });
    return row ? RefreshSessionMapper.toDomain(row) : null;
  }

  async save(session: RefreshSession): Promise<void> {
    await this.repository.save(RefreshSessionMapper.toPersistence(session));
  }

  async revokeIfActive(
    sessionId: string,
    at: Date,
    reason: RevocationReason,
  ): Promise<boolean> {
    // UPDATE ... WHERE id = $1 AND revoked_at IS NULL: si dos peticiones
    // llegan a la vez, solo una cambia la fila.
    const result = await this.repository.update(
      { id: sessionId, revokedAt: IsNull() },
      { revokedAt: at, revocationReason: reason },
    );
    return (result.affected ?? 0) > 0;
  }

  async revokeAllForUser(
    userId: string,
    at: Date,
    reason: RevocationReason,
  ): Promise<void> {
    await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: at, revocationReason: reason },
    );
  }
}
