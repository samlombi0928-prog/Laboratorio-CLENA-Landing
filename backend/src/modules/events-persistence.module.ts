import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { EVENT_REPOSITORY } from '../application/events/ports/event-repository.js';
import { EventOrmEntity } from '../infrastructure/events/event.orm-entity.js';
import { TypeOrmEventRepository } from '../infrastructure/events/typeorm-event.repository.js';

/**
 * Repositorio de eventos con TypeORM. Está separado de los módulos que lo usan
 * para que las pruebas e2e lo cambien por uno en memoria.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EventOrmEntity])],
  providers: [
    {
      provide: EVENT_REPOSITORY,
      inject: [getRepositoryToken(EventOrmEntity)],
      useFactory: (repository: Repository<EventOrmEntity>) =>
        new TypeOrmEventRepository(repository),
    },
  ],
  exports: [EVENT_REPOSITORY],
})
export class EventsPersistenceModule {}
