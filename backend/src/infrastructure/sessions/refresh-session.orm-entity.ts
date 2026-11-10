import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { UserOrmEntity } from '../users/user.orm-entity.js';

const REVOCATION_REASON_CHECK = `"revocation_reason" IN ('rotated', 'logged_out', 'reuse_detected')`;

@Entity('refresh_sessions')
@Unique('UQ_refresh_sessions_token_hash', ['tokenHash'])
@Index('IDX_refresh_sessions_user_id', ['userId'])
@Check('CHK_refresh_sessions_revocation_reason', REVOCATION_REASON_CHECK)
export class RefreshSessionOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
    primaryKeyConstraintName: 'PK_refresh_sessions',
  })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Al eliminar un usuario se eliminan sus sesiones (Ley 1581, #16).
  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_refresh_sessions_user_id',
  })
  user?: UserOrmEntity;

  /** SHA-256 en hexadecimal del refresh token. */
  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({
    name: 'revocation_reason',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  revocationReason: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
