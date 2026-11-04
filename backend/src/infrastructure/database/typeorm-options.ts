import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '../config/environment-variables.js';

type DatabaseVariables = Pick<
  EnvironmentVariables,
  'DB_HOST' | 'DB_PORT' | 'DB_USERNAME' | 'DB_PASSWORD' | 'DB_NAME'
>;

/**
 * Opciones de conexión compartidas por la aplicación y por la CLI de
 * migraciones. El esquema solo cambia con migraciones: synchronize siempre
 * queda en false.
 */
export function createTypeOrmOptions(
  variables: DatabaseVariables,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: variables.DB_HOST,
    port: variables.DB_PORT,
    username: variables.DB_USERNAME,
    password: variables.DB_PASSWORD,
    database: variables.DB_NAME,
    synchronize: false,
    migrationsTableName: 'migraciones',
    migrations: [join(import.meta.dirname, 'migrations', '*.{js,ts}')],
    extra: { connectionTimeoutMillis: 5000 },
  };
}
