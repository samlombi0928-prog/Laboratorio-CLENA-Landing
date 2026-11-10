import type { DatabaseChecker } from './ports/database-checker.js';

export interface HealthStatus {
  estado: 'ok' | 'degradado';
  baseDatos: 'disponible' | 'no disponible';
  fecha: string;
}

export class CheckHealthUseCase {
  constructor(
    private readonly databaseChecker: DatabaseChecker,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<HealthStatus> {
    const available = await this.databaseChecker
      .isAvailable()
      .catch(() => false);

    return {
      estado: available ? 'ok' : 'degradado',
      baseDatos: available ? 'disponible' : 'no disponible',
      fecha: this.now().toISOString(),
    };
  }
}
