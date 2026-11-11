import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabla de eventos de la agenda (#44). Las inscripciones (#46) controlan el
 * cupo con la columna capacity.
 */
export class CreateEvents1794033608481 implements MigrationInterface {
  name = 'CreateEvents1794033608481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "events" (
        "id" uuid NOT NULL,
        "title" character varying(150) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "location" character varying(150) NOT NULL,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "capacity" integer NOT NULL,
        "publish_from" TIMESTAMP WITH TIME ZONE NOT NULL,
        "publish_until" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "CHK_events_publish_period" CHECK ("publish_until" >= "publish_from"),
        CONSTRAINT "CHK_events_capacity" CHECK ("capacity" > 0),
        CONSTRAINT "PK_events" PRIMARY KEY ("id")
      )`,
    );
    // La agenda lista los eventos por fecha, el más próximo primero.
    await queryRunner.query(
      `CREATE INDEX "IDX_events_starts_at" ON "events" ("starts_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_events_starts_at"`);
    await queryRunner.query(`DROP TABLE "events"`);
  }
}
