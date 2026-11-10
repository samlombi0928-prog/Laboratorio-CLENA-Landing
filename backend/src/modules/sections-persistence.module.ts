import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { SECTION_ITEM_REPOSITORY } from '../application/sections/ports/section-item-repository.js';
import { SectionItemOrmEntity } from '../infrastructure/sections/section-item.orm-entity.js';
import { TypeOrmSectionItemRepository } from '../infrastructure/sections/typeorm-section-item.repository.js';

/**
 * Repositorio de las secciones con TypeORM. Está separado de SectionsModule
 * para que las pruebas e2e lo cambien por uno en memoria.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SectionItemOrmEntity])],
  providers: [
    {
      provide: SECTION_ITEM_REPOSITORY,
      inject: [getRepositoryToken(SectionItemOrmEntity)],
      useFactory: (repository: Repository<SectionItemOrmEntity>) =>
        new TypeOrmSectionItemRepository(repository),
    },
  ],
  exports: [SECTION_ITEM_REPOSITORY],
})
export class SectionsPersistenceModule {}
