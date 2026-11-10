import { Check, Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('events')
@Index('IDX_events_starts_at', ['startsAt'])
@Check('CHK_events_capacity', `"capacity" > 0`)
@Check('CHK_events_publish_period', `"publish_until" >= "publish_from"`)
export class EventOrmEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_events' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 150 })
  location: string;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'integer' })
  capacity: number;

  @Column({ name: 'publish_from', type: 'timestamptz' })
  publishFrom: Date;

  @Column({ name: 'publish_until', type: 'timestamptz' })
  publishUntil: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
