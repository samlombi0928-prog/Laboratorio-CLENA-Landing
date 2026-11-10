import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export const LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT = 5432;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsIn(LOG_LEVELS)
  LOG_LEVEL: LogLevel = 'info';

  /** Orígenes permitidos por CORS, separados por coma. */
  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN = 'http://localhost:5173';

  /** Secreto con el que se firman los access tokens. */
  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(3600)
  JWT_ACCESS_TTL_SECONDS = 900;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  REFRESH_TOKEN_TTL_DAYS = 7;

  /**
   * Carpeta donde se guardan las imágenes subidas. En Docker debe ser un
   * volumen, o las imágenes se pierden al recrear el contenedor.
   */
  @IsString()
  @IsNotEmpty()
  STORAGE_DIR = 'storage';

  /**
   * Dirección pública de la API con la que se arman las URL de las imágenes.
   * Si la API está detrás de un proxy con prefijo, se incluye aquí (por
   * ejemplo https://clena.co/api).
   */
  @IsUrl(
    {
      require_tld: false,
      require_protocol: true,
      protocols: ['http', 'https'],
    },
    { message: 'PUBLIC_BASE_URL debe ser una URL http o https' },
  )
  PUBLIC_BASE_URL = 'http://localhost:3000';
}

/**
 * Valida las variables de entorno al arrancar. Si falta alguna o tiene un
 * valor inválido, la aplicación no inicia y el error dice cuál es.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const variables = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(variables);

  if (errors.length > 0) {
    const detail = errors
      .map(
        (e) =>
          `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
      )
      .join('\n  ');
    throw new Error(`Variables de entorno inválidas:\n  ${detail}`);
  }

  return variables;
}
