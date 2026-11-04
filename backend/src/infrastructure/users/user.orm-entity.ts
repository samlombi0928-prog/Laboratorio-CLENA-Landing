import {
  Check,
  Column,
  Entity,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Unique('UQ_users_email', ['email'])
@Check('CHK_users_role', `"role" IN ('admin', 'staff', 'visitor')`)
export class UserOrmEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_users' })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  role: string;

  @Column({ name: 'privacy_consent_at', type: 'timestamptz' })
  privacyConsentAt: Date;

  @Column({ name: 'privacy_notice_version', type: 'varchar', length: 30 })
  privacyNoticeVersion: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
