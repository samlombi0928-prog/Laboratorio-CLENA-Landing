import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Horario real de atención del CLENA, que confirmó el equipo de Introducción el
 * 12 de noviembre de 2026, en lugar del horario de ejemplo de SeedSectionItems.
 * Solo cambia las filas que siguen con el texto de ejemplo: si el personal ya las
 * editó desde el panel, se respeta lo que puso.
 */
const CAMBIOS: Array<{
  id: string;
  antes: { title: string; description: string };
  despues: { title: string; description: string };
}> = [
  {
    id: '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b09',
    antes: {
      title: 'Lunes a viernes',
      description: '8:00 a. m. a 5:00 p. m. (horario de ejemplo)',
    },
    despues: {
      title: 'Lunes a viernes',
      description: '8:00 a. m. a 4:00 p. m.',
    },
  },
  {
    id: '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b10',
    antes: {
      title: 'Sábados',
      description: '9:00 a. m. a 1:00 p. m. (horario de ejemplo)',
    },
    despues: {
      title: 'Sábados, domingos y festivos',
      description: 'Sin atención presencial',
    },
  },
];

export class UpdateScheduleSeed1794496000000 implements MigrationInterface {
  name = 'UpdateScheduleSeed1794496000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { id, antes, despues } of CAMBIOS) {
      await queryRunner.query(
        `UPDATE "section_items" SET "title" = $2, "description" = $3, "updated_at" = now()
         WHERE "id" = $1 AND "title" = $4 AND "description" = $5`,
        [
          id,
          despues.title,
          despues.description,
          antes.title,
          antes.description,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { id, antes, despues } of CAMBIOS) {
      await queryRunner.query(
        `UPDATE "section_items" SET "title" = $2, "description" = $3, "updated_at" = now()
         WHERE "id" = $1 AND "title" = $4 AND "description" = $5`,
        [
          id,
          antes.title,
          antes.description,
          despues.title,
          despues.description,
        ],
      );
    }
  }
}
