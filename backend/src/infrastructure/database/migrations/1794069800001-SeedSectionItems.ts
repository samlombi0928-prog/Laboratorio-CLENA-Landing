import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Datos semilla de las secciones de la landing para la demo. Son de ejemplo:
 * el personal del CLENA los reemplaza desde el panel con la información real.
 */
const ITEMS: Array<
  [id: string, kind: string, title: string, description: string, order: number]
> = [
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b01',
    'space',
    'Museo de la Aduana',
    'Salas con la historia de Barranquilla y de su relación con el río y el comercio.',
    1,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b02',
    'space',
    'Sala de exposiciones',
    'Exposiciones de arte que cambian durante el año.',
    2,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b03',
    'space',
    'Biblioteca',
    'Colección general y sala de lectura abiertas al público.',
    3,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b04',
    'space',
    'Archivo Histórico',
    'Consulta de documentos sobre la historia de la región.',
    4,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b05',
    'space',
    'Café de la Aduana',
    'Un espacio para tomar algo durante la visita.',
    5,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b06',
    'service',
    'Consulta en biblioteca',
    'Lectura en sala y orientación para encontrar libros (ejemplo).',
    1,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b07',
    'service',
    'Consulta de documentos históricos',
    'Solicitud y revisión de documentos en el Archivo Histórico (ejemplo).',
    2,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b08',
    'service',
    'Visitas guiadas',
    'Recorridos por el edificio para grupos (ejemplo).',
    3,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b09',
    'schedule',
    'Lunes a viernes',
    '8:00 a. m. a 5:00 p. m. (horario de ejemplo)',
    1,
  ],
  [
    '0b6f1a52-7c1e-4d6a-9a1f-2f3e4d5c6b10',
    'schedule',
    'Sábados',
    '9:00 a. m. a 1:00 p. m. (horario de ejemplo)',
    2,
  ],
];

export class SeedSectionItems1794069800001 implements MigrationInterface {
  name = 'SeedSectionItems1794069800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [id, kind, title, description, order] of ITEMS) {
      await queryRunner.query(
        `INSERT INTO "section_items" ("id", "kind", "title", "description", "sort_order", "published", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, $5, true, now(), now())`,
        [id, kind, title, description, order],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "section_items" WHERE "id" = ANY($1)`,
      [ITEMS.map(([id]) => id)],
    );
  }
}
