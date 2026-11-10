import { Module } from '@nestjs/common';
import { CheckHealthUseCase } from '../application/health/check-health.use-case.js';
import {
  DATABASE_CHECKER,
  type DatabaseChecker,
} from '../application/health/ports/database-checker.js';
import { TypeOrmDatabaseChecker } from '../infrastructure/health/typeorm-database-checker.js';
import { HealthController } from '../presentation/http/health/health.controller.js';

/**
 * Raíz de composición del módulo de salud: une el puerto con su
 * implementación y crea el caso de uso sin que este conozca a NestJS.
 * Los módulos de #15 y #17 siguen el mismo patrón con sus repositorios.
 */
@Module({
  controllers: [HealthController],
  providers: [
    { provide: DATABASE_CHECKER, useClass: TypeOrmDatabaseChecker },
    {
      provide: CheckHealthUseCase,
      inject: [DATABASE_CHECKER],
      useFactory: (databaseChecker: DatabaseChecker) =>
        new CheckHealthUseCase(databaseChecker),
    },
  ],
})
export class HealthModule {}
