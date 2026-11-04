import { RefreshSession } from '../../domain/sessions/refresh-session.js';
import { RefreshSessionOrmEntity } from './refresh-session.orm-entity.js';

export const RefreshSessionMapper = {
  toDomain(row: RefreshSessionOrmEntity): RefreshSession {
    return RefreshSession.restore({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  },

  toPersistence(session: RefreshSession): RefreshSessionOrmEntity {
    const row = new RefreshSessionOrmEntity();
    row.id = session.id;
    row.userId = session.userId;
    row.tokenHash = session.tokenHash;
    row.expiresAt = session.expiresAt;
    row.revokedAt = session.revokedAt;
    row.createdAt = session.createdAt;
    return row;
  },
};
