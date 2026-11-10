import type { IncomingMessage } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { LogLevel } from '../config/environment-variables.js';

/**
 * Logs estructurados en JSON con pino. Cada petición HTTP queda registrada con
 * su método, ruta, estado y duración; las cabeceras sensibles se ocultan.
 */
export function createLoggerOptions(level: LogLevel): Params {
  return {
    pinoHttp: {
      level,
      // El login y la renovación devuelven el refresh token en Set-Cookie:
      // con él, quien lea los logs podría robar la sesión.
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
      ],
      autoLogging: {
        ignore: (req: IncomingMessage) => req.url === '/api/v1/health',
      },
    },
  };
}
