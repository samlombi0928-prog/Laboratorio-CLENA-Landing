import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Eventos semilla para la demo de la agenda (#44, #45) y de las inscripciones
 * (#46). Las fechas se calculan al correr la migración, relativas a ese día y
 * en hora de Colombia, para que la demo siempre tenga eventos vigentes.
 */
const EVENTS: Array<
  [
    id: string,
    title: string,
    description: string,
    location: string,
    startsInDays: number,
    startsAtHour: number,
    capacity: number,
    publishFromDays: number,
  ]
> = [
  [
    '5e7d2c10-4b1a-4f3e-9a6d-1c2b3a4d5e01',
    'Noche de jazz en la Aduana',
    'Concierto al aire libre con músicos de Barranquilla (evento de ejemplo).',
    'Patio central',
    10,
    19,
    40,
    -7,
  ],
  [
    '5e7d2c10-4b1a-4f3e-9a6d-1c2b3a4d5e02',
    'Taller de fotografía patrimonial',
    'Aprende a fotografiar la arquitectura del complejo. Cupo muy limitado (evento de ejemplo).',
    'Sala de exposiciones',
    5,
    10,
    3,
    -3,
  ],
  [
    '5e7d2c10-4b1a-4f3e-9a6d-1c2b3a4d5e03',
    'Feria del libro del Caribe',
    'Editoriales y autores de la región en la biblioteca (evento de ejemplo).',
    'Biblioteca',
    20,
    9,
    100,
    -1,
  ],
  // Todavía no se publica: no aparece en la agenda ni acepta inscripciones.
  [
    '5e7d2c10-4b1a-4f3e-9a6d-1c2b3a4d5e04',
    'Visita guiada al Archivo Histórico',
    'Recorrido por la colección de documentos de la región (evento de ejemplo).',
    'Archivo Histórico',
    30,
    15,
    15,
    7,
  ],
  // Ya pasó: tampoco aparece en la agenda.
  [
    '5e7d2c10-4b1a-4f3e-9a6d-1c2b3a4d5e05',
    'Conversatorio sobre la historia del puerto',
    'Charla sobre el río Magdalena y el comercio de Barranquilla (evento de ejemplo).',
    'Museo de la Aduana',
    -3,
    17,
    60,
    -15,
  ],
];

/** Medianoche de hoy en Colombia, más días y horas. */
const BOGOTA_DAY = (days: string, hours: string) =>
  `(date_trunc('day', now() AT TIME ZONE 'America/Bogota') + make_interval(days => ${days}, hours => ${hours})) AT TIME ZONE 'America/Bogota'`;

export class SeedEvents1794069800002 implements MigrationInterface {
  name = 'SeedEvents1794069800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [
      id,
      title,
      description,
      location,
      startsInDays,
      startsAtHour,
      capacity,
      publishFromDays,
    ] of EVENTS) {
      // La publicación dura hasta que empieza el evento.
      await queryRunner.query(
        `INSERT INTO "events" ("id", "title", "description", "location", "starts_at", "capacity", "publish_from", "publish_until", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, ${BOGOTA_DAY('$5::int', '$6::int')}, $7, ${BOGOTA_DAY('$8::int', '0')}, ${BOGOTA_DAY('$5::int', '$6::int')}, now(), now())`,
        [
          id,
          title,
          description,
          location,
          startsInDays,
          startsAtHour,
          capacity,
          publishFromDays,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "events" WHERE "id" = ANY($1)`, [
      EVENTS.map(([id]) => id),
    ]);
  }
}
