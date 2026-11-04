import { IsNull, type Repository } from 'typeorm';
import type { SessionRepository } from '../../application/auth/ports/session-repository.js';
import type { RefreshSession } from '../../domain/sessions/refresh-session.js';
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

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: at },
    );
  }
}
