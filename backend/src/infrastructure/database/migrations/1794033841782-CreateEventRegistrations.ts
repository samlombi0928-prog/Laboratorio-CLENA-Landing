import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inscripciones a eventos (#46). Solo guarda el nombre, el correo y el
 * consentimiento del aviso de privacidad (Ley 1581, datos mínimos).
 */
export class CreateEventRegistrations1794033841782 implements MigrationInterface {
  name = 'CreateEventRegistrations1794033841782';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // La restricción única también es el índice para listar los inscritos de
    // un evento.
    await queryRunner.query(
      `CREATE TABLE "event_registrations" (
        "id" uuid NOT NULL,
        "event_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "email" character varying(254) NOT NULL,
        "privacy_consent_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "privacy_notice_version" character varying(30) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "UQ_event_registrations_event_id_email" UNIQUE ("event_id", "email"),
        CONSTRAINT "PK_event_registrations" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_registrations" ADD CONSTRAINT "FK_event_registrations_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_registrations" DROP CONSTRAINT "FK_event_registrations_event_id"`,
    );
    await queryRunner.query(`DROP TABLE "event_registrations"`);
  }
}
