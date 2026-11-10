import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabla de recorridos de la historia #17. La portada se guarda como la clave
 * del archivo en el almacenamiento, no como la URL.
 */
export class CreateTours1793912119862 implements MigrationInterface {
  name = 'CreateTours1793912119862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tours" (
        "id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "title" character varying(120) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "cover_key" character varying(255),
        "status" character varying(20) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "CHK_tours_status" CHECK ("status" IN ('draft', 'published')),
        CONSTRAINT "PK_tours" PRIMARY KEY ("id")
      )`,
    );
    // Para listar "mis recorridos", del más reciente al más antiguo.
    await queryRunner.query(
      `CREATE INDEX "IDX_tours_owner_id_created_at" ON "tours" ("owner_id", "created_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tours" ADD CONSTRAINT "FK_tours_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tours" DROP CONSTRAINT "FK_tours_owner_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tours_owner_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "tours"`);
  }
}
