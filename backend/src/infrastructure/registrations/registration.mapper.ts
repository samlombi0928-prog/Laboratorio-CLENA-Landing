import { Registration } from '../../domain/registrations/registration.js';
import { RegistrationOrmEntity } from './registration.orm-entity.js';

/** Convierte entre la entidad de dominio y la fila de la base de datos. */
export const RegistrationMapper = {
  toDomain(row: RegistrationOrmEntity): Registration {
    return Registration.restore({
      id: row.id,
      eventId: row.eventId,
      name: row.name,
      email: row.email,
      privacyConsentAt: row.privacyConsentAt,
      privacyNoticeVersion: row.privacyNoticeVersion,
      createdAt: row.createdAt,
    });
  },

  toPersistence(registration: Registration): RegistrationOrmEntity {
    const row = new RegistrationOrmEntity();
    row.id = registration.id;
    row.eventId = registration.eventId;
    row.name = registration.name;
    row.email = registration.email;
    row.privacyConsentAt = registration.privacyConsentAt;
    row.privacyNoticeVersion = registration.privacyNoticeVersion;
    row.createdAt = registration.createdAt;
    return row;
  },
};
