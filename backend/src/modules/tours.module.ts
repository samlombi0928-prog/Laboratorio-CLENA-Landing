import { Module } from '@nestjs/common';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../application/storage/ports/file-storage.js';
import { CreateTourUseCase } from '../application/tours/create-tour.use-case.js';
import { GetTourUseCase } from '../application/tours/get-tour.use-case.js';
import { ListMyToursUseCase } from '../application/tours/list-my-tours.use-case.js';
import {
  TOUR_REPOSITORY,
  type TourRepository,
} from '../application/tours/ports/tour-repository.js';
import { ToursController } from '../presentation/http/tours/tours.controller.js';
import { StorageModule } from './storage.module.js';
import { ToursPersistenceModule } from './tours-persistence.module.js';

@Module({
  imports: [ToursPersistenceModule, StorageModule],
  controllers: [ToursController],
  providers: [
    {
      provide: CreateTourUseCase,
      inject: [TOUR_REPOSITORY, FILE_STORAGE],
      useFactory: (tours: TourRepository, storage: FileStorage) =>
        new CreateTourUseCase(tours, storage),
    },
    {
      provide: ListMyToursUseCase,
      inject: [TOUR_REPOSITORY, FILE_STORAGE],
      useFactory: (tours: TourRepository, storage: FileStorage) =>
        new ListMyToursUseCase(tours, storage),
    },
    {
      provide: GetTourUseCase,
      inject: [TOUR_REPOSITORY, FILE_STORAGE],
      useFactory: (tours: TourRepository, storage: FileStorage) =>
        new GetTourUseCase(tours, storage),
    },
  ],
})
export class ToursModule {}
