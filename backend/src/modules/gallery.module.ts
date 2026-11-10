import { Module } from '@nestjs/common';
import { DeleteGalleryImageUseCase } from '../application/gallery/delete-gallery-image.use-case.js';
import { ListGalleryImagesUseCase } from '../application/gallery/list-gallery-images.use-case.js';
import {
  GALLERY_IMAGE_REPOSITORY,
  type GalleryImageRepository,
} from '../application/gallery/ports/gallery-image-repository.js';
import { UploadGalleryImageUseCase } from '../application/gallery/upload-gallery-image.use-case.js';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../application/storage/ports/file-storage.js';
import { GalleryController } from '../presentation/http/gallery/gallery.controller.js';
import { GalleryPersistenceModule } from './gallery-persistence.module.js';
import { StorageModule } from './storage.module.js';

@Module({
  imports: [GalleryPersistenceModule, StorageModule],
  controllers: [GalleryController],
  providers: [
    {
      provide: UploadGalleryImageUseCase,
      inject: [GALLERY_IMAGE_REPOSITORY, FILE_STORAGE],
      useFactory: (images: GalleryImageRepository, storage: FileStorage) =>
        new UploadGalleryImageUseCase(images, storage),
    },
    {
      provide: ListGalleryImagesUseCase,
      inject: [GALLERY_IMAGE_REPOSITORY, FILE_STORAGE],
      useFactory: (images: GalleryImageRepository, storage: FileStorage) =>
        new ListGalleryImagesUseCase(images, storage),
    },
    {
      provide: DeleteGalleryImageUseCase,
      inject: [GALLERY_IMAGE_REPOSITORY, FILE_STORAGE],
      useFactory: (images: GalleryImageRepository, storage: FileStorage) =>
        new DeleteGalleryImageUseCase(images, storage),
    },
  ],
})
export class GalleryModule {}
