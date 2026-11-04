import { Environment, validateEnvironment } from './environment-variables.js';

const required = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'clena',
  DB_PASSWORD: 'clena_local',
  DB_NAME: 'clena',
};

describe('validateEnvironment', () => {
  it('aplica los valores por defecto y convierte los números', () => {
    const variables = validateEnvironment({ ...required, DB_PORT: '5433' });

    expect(variables.NODE_ENV).toBe(Environment.Development);
    expect(variables.PORT).toBe(3000);
    expect(variables.DB_PORT).toBe(5433);
    expect(variables.LOG_LEVEL).toBe('info');
    expect(variables.CORS_ORIGIN).toBe('http://localhost:5173');
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
