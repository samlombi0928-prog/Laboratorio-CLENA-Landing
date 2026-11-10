import { Module } from '@nestjs/common';
import {
  SECTION_ITEM_REPOSITORY,
  type SectionItemRepository,
} from '../application/sections/ports/section-item-repository.js';
import { CreateSectionItemUseCase } from '../application/sections/create-section-item.use-case.js';
import { DeleteSectionItemUseCase } from '../application/sections/delete-section-item.use-case.js';
import { ListSectionItemsUseCase } from '../application/sections/list-section-items.use-case.js';
import { UpdateSectionItemUseCase } from '../application/sections/update-section-item.use-case.js';
import { SectionsController } from '../presentation/http/sections/sections.controller.js';
import { SectionsPersistenceModule } from './sections-persistence.module.js';

/** Secciones de la landing: espacios, servicios y horarios (#42 y #43). */
@Module({
  imports: [SectionsPersistenceModule],
  controllers: [SectionsController],
  providers: [
    {
      provide: ListSectionItemsUseCase,
      inject: [SECTION_ITEM_REPOSITORY],
      useFactory: (items: SectionItemRepository) =>
        new ListSectionItemsUseCase(items),
    },
    {
      provide: CreateSectionItemUseCase,
      inject: [SECTION_ITEM_REPOSITORY],
      useFactory: (items: SectionItemRepository) =>
        new CreateSectionItemUseCase(items),
    },
    {
      provide: UpdateSectionItemUseCase,
      inject: [SECTION_ITEM_REPOSITORY],
      useFactory: (items: SectionItemRepository) =>
        new UpdateSectionItemUseCase(items),
    },
    {
      provide: DeleteSectionItemUseCase,
      inject: [SECTION_ITEM_REPOSITORY],
      useFactory: (items: SectionItemRepository) =>
        new DeleteSectionItemUseCase(items),
    },
  ],
})
export class SectionsModule {}
