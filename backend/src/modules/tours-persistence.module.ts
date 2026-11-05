import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { TOUR_REPOSITORY } from '../application/tours/ports/tour-repository.js';
import { TourOrmEntity } from '../infrastructure/tours/tour.orm-entity.js';
import { TypeOrmTourRepository } from '../infrastructure/tours/typeorm-tour.repository.js';

/**
 * Repositorio de recorridos con TypeORM. Está separado de ToursModule para
 * que las pruebas e2e lo cambien por uno en memoria.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TourOrmEntity])],
  providers: [
    {
      provide: TOUR_REPOSITORY,
      inject: [getRepositoryToken(TourOrmEntity)],
      useFactory: (repository: Repository<TourOrmEntity>) =>
        new TypeOrmTourRepository(repository),
    },
  ],
  exports: [TOUR_REPOSITORY],
})
export class ToursPersistenceModule {}
