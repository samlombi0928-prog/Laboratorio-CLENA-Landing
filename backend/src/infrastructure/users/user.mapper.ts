import { Role } from '../../domain/users/role.js';
import { User } from '../../domain/users/user.js';
import { UserOrmEntity } from './user.orm-entity.js';

/** Convierte entre la entidad de dominio y la fila de la base de datos. */
export const UserMapper = {
  toDomain(row: UserOrmEntity): User {
    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as Role,
      privacyConsentAt: row.privacyConsentAt,
      privacyNoticeVersion: row.privacyNoticeVersion,
      createdAt: row.createdAt,
    });
  },

  toPersistence(user: User): UserOrmEntity {
    const row = new UserOrmEntity();
    row.id = user.id;
    row.name = user.name;
    row.email = user.email;
    row.passwordHash = user.passwordHash;
    row.role = user.role;
    row.privacyConsentAt = user.privacyConsentAt;
    row.privacyNoticeVersion = user.privacyNoticeVersion;
    row.createdAt = user.createdAt;
    return row;
  },
};
