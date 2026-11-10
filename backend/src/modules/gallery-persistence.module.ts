import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { GALLERY_IMAGE_REPOSITORY } from '../application/gallery/ports/gallery-image-repository.js';
import { GalleryImageOrmEntity } from '../infrastructure/gallery/gallery-image.orm-entity.js';
import { TypeOrmGalleryImageRepository } from '../infrastructure/gallery/typeorm-gallery-image.repository.js';

/**
 * Repositorio de la galería con TypeORM. Está separado de GalleryModule para
 * que las pruebas e2e lo cambien por uno en memoria.
 */
@Module({
  imports: [TypeOrmModule.forFeature([GalleryImageOrmEntity])],
  providers: [
    {
      provide: GALLERY_IMAGE_REPOSITORY,
      inject: [getRepositoryToken(GalleryImageOrmEntity)],
      useFactory: (repository: Repository<GalleryImageOrmEntity>) =>
        new TypeOrmGalleryImageRepository(repository),
    },
  ],
  exports: [GALLERY_IMAGE_REPOSITORY],
})
export class GalleryPersistenceModule {}
