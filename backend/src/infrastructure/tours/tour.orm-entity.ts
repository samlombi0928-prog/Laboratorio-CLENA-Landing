import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserOrmEntity } from '../users/user.orm-entity.js';

@Entity('tours')
@Index('IDX_tours_owner_id_created_at', ['ownerId', 'createdAt'])
@Check('CHK_tours_status', `"status" IN ('draft', 'published')`)
export class TourOrmEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_tours' })
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  // Al eliminar un usuario se eliminan sus recorridos (Ley 1581, #16).
  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'owner_id',
    foreignKeyConstraintName: 'FK_tours_owner_id',
  })
  owner?: UserOrmEntity;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Clave del archivo en el almacenamiento, por ejemplo covers/<uuid>.jpg. */
  @Column({ name: 'cover_key', type: 'varchar', length: 255, nullable: true })
  coverKey: string | null;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
