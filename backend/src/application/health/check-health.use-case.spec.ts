import { CheckHealthUseCase } from './check-health.use-case.js';
import type { DatabaseChecker } from './ports/database-checker.js';

const fixedDate = new Date('2026-11-04T12:00:00.000Z');

function createUseCase(isAvailable: DatabaseChecker['isAvailable']) {
  return new CheckHealthUseCase({ isAvailable }, () => fixedDate);
}

describe('CheckHealthUseCase', () => {
  it('reporta ok cuando la base de datos responde', async () => {
    const useCase = createUseCase(() => Promise.resolve(true));

    await expect(useCase.execute()).resolves.toEqual({
      estado: 'ok',
      baseDatos: 'disponible',
      fecha: '2026-11-04T12:00:00.000Z',
    });
  });

  it('reporta degradado cuando la base de datos no está disponible', async () => {
    const useCase = createUseCase(() => Promise.resolve(false));

    await expect(useCase.execute()).resolves.toMatchObject({
      estado: 'degradado',
      baseDatos: 'no disponible',
    });
  });

  it('reporta degradado si la verificación falla', async () => {
    const useCase = createUseCase(() =>
      Promise.reject(new Error('conexión rechazada')),
    );

    await expect(useCase.execute()).resolves.toMatchObject({
      estado: 'degradado',
    });
  });

  it('usa la fecha actual si no se le pasa un reloj', async () => {
    const useCase = new CheckHealthUseCase({
      isAvailable: () => Promise.resolve(true),
    });

    const { fecha } = await useCase.execute();

    expect(Number.isNaN(Date.parse(fecha))).toBe(false);
  });
});
