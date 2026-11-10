import { Writable } from 'node:stream';
import { pino, type LoggerOptions } from 'pino';
import { createLoggerOptions } from './logger-options.js';

/** Escribe un log con las opciones de la aplicación y devuelve el JSON. */
function logWithAppOptions(entry: object): Record<string, unknown> {
  const options = createLoggerOptions('info').pinoHttp as LoggerOptions;
  let output = '';
  const stream = new Writable({
    write(chunk: Buffer, _encoding, done) {
      output += chunk.toString();
      done();
    },
  });
  pino({ redact: options.redact }, stream).info(entry);
  return JSON.parse(output) as Record<string, unknown>;
}

describe('createLoggerOptions', () => {
  it('oculta el token, la cookie de la petición y el refresh token de la respuesta', () => {
    const log = logWithAppOptions({
      req: {
        headers: {
          authorization: 'Bearer token-de-acceso',
          cookie: 'refresh_token=viejo',
          'user-agent': 'navegador',
        },
      },
      res: {
        headers: {
          'set-cookie': 'refresh_token=nuevo; HttpOnly',
          'content-type': 'application/json',
        },
      },
    });

    expect(log).toMatchObject({
      req: {
        headers: {
          authorization: '[Redacted]',
          cookie: '[Redacted]',
          'user-agent': 'navegador',
        },
      },
      res: {
        headers: {
          'set-cookie': '[Redacted]',
          'content-type': 'application/json',
        },
      },
    });
  });
});
