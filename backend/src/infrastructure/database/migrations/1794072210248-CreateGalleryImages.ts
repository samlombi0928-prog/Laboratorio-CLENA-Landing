import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabla de imágenes de la galería (historias #47 y #48). La imagen se guarda
 * como la clave del archivo en el almacenamiento, no como la URL.
 */
export class CreateGalleryImages1794072210248 implements MigrationInterface {
  name = 'CreateGalleryImages1794072210248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "gallery_images" (
        "id" uuid NOT NULL,
        "title" character varying(120) NOT NULL,
        "alt_text" character varying(250) NOT NULL,
        "image_key" character varying(255) NOT NULL,
        "uploaded_by" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_gallery_images" PRIMARY KEY ("id")
      )`,
    );
    // Para listar la galería paginada, de la más reciente a la más antigua.
    await queryRunner.query(
      `CREATE INDEX "IDX_gallery_images_created_at_id" ON "gallery_images" ("created_at", "id")`,
    );
    // Un archivo del almacenamiento pertenece a una sola imagen.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_gallery_images_image_key" ON "gallery_images" ("image_key")`,
    );
    // Si se elimina la cuenta de quien subió la imagen, la imagen se queda y
    // solo se borra el vínculo con la persona.
    await queryRunner.query(
      `ALTER TABLE "gallery_images" ADD CONSTRAINT "FK_gallery_images_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gallery_images" DROP CONSTRAINT "FK_gallery_images_uploaded_by"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_gallery_images_image_key"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_gallery_images_created_at_id"`,
    );
    await queryRunner.query(`DROP TABLE "gallery_images"`);
  }
}
