import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { EventOrmEntity } from '../events/event.orm-entity.js';

@Entity('event_registrations')
// Un correo se inscribe una sola vez por evento. El índice de esta restricción
// también sirve para listar los inscritos de un evento.
@Unique('UQ_event_registrations_event_id_email', ['eventId', 'email'])
export class RegistrationOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
    primaryKeyConstraintName: 'PK_event_registrations',
  })
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  // Al eliminar un evento se eliminan sus inscripciones.
  @ManyToOne(() => EventOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'event_id',
    foreignKeyConstraintName: 'FK_event_registrations_event_id',
  })
  event?: EventOrmEntity;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ name: 'privacy_consent_at', type: 'timestamptz' })
  privacyConsentAt: Date;

  @Column({ name: 'privacy_notice_version', type: 'varchar', length: 30 })
  privacyNoticeVersion: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
