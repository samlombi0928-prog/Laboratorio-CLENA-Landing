import { Environment, validateEnvironment } from './environment-variables.js';

const required = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'clena',
  DB_PASSWORD: 'clena_local',
  DB_NAME: 'clena',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
};

describe('validateEnvironment', () => {
  it('aplica los valores por defecto y convierte los números', () => {
    const variables = validateEnvironment({ ...required, DB_PORT: '5433' });

    expect(variables.NODE_ENV).toBe(Environment.Development);
    expect(variables.PORT).toBe(3000);
    expect(variables.DB_PORT).toBe(5433);
    expect(variables.LOG_LEVEL).toBe('info');
    expect(variables.CORS_ORIGIN).toBe('http://localhost:5173');
    expect(variables.JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(variables.REFRESH_TOKEN_TTL_DAYS).toBe(7);
    expect(variables.SMTP_HOST).toBe('localhost');
    expect(variables.SMTP_PORT).toBe(1025);
    expect(variables.MAIL_FROM).toBe(
      'CLENA Digital <no-responder@clena.local>',
    );
  });

  it('exige un secreto de JWT de al menos 32 caracteres', () => {
    expect(() =>
      validateEnvironment({ ...required, JWT_ACCESS_SECRET: 'corto' }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('falla si falta una variable obligatoria', () => {
    const { DB_PASSWORD: _omitted, ...incomplete } = required;

    expect(() => validateEnvironment(incomplete)).toThrow(/DB_PASSWORD/);
  });

  it('falla si un valor no es válido', () => {
    expect(() =>
      validateEnvironment({ ...required, LOG_LEVEL: 'mucho' }),
    ).toThrow(/LOG_LEVEL/);
    expect(() => validateEnvironment({ ...required, PORT: 'abc' })).toThrow(
      /PORT/,
    );
  });
});
