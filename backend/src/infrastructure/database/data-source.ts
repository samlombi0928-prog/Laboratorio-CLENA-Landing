import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { validateEnvironment } from '../config/environment-variables.js';
import { createTypeOrmOptions } from './typeorm-options.js';

/**
 * Fuente de datos que usa la CLI de TypeORM para generar y correr
 * migraciones (ver los scripts migration:* en package.json).
 */
export default new DataSource({
  ...createTypeOrmOptions(validateEnvironment(process.env)),
  entities: [join(import.meta.dirname, '..', '**', '*.orm-entity.{js,ts}')],
});
