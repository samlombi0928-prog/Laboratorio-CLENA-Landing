import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabla de los elementos de las secciones de la landing (espacios, servicios
 * y horarios) que administra el personal del CLENA, historias #42 y #43.
 */
export class CreateSectionItems1794069800000 implements MigrationInterface {
  name = 'CreateSectionItems1794069800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "section_items" (
        "id" uuid NOT NULL,
        "kind" character varying(20) NOT NULL,
        "title" character varying(120) NOT NULL,
        "description" character varying(1000) NOT NULL,
        "sort_order" integer NOT NULL,
        "published" boolean NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "CHK_section_items_kind" CHECK ("kind" IN ('space', 'service', 'schedule')),
        CONSTRAINT "CHK_section_items_sort_order" CHECK ("sort_order" BETWEEN 0 AND 999),
        CONSTRAINT "PK_section_items" PRIMARY KEY ("id")
      )`,
    );
    // La landing pide los publicados de una sección, en su orden.
    await queryRunner.query(
      `CREATE INDEX "IDX_section_items_published_kind_order" ON "section_items" ("published", "kind", "sort_order")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_section_items_published_kind_order"`,
    );
    await queryRunner.query(`DROP TABLE "section_items"`);
  }
}
