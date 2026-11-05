import { Module } from '@nestjs/common';
import { FILE_STORAGE } from '../application/storage/ports/file-storage.js';
import { UnavailableFileStorage } from '../infrastructure/storage/unavailable-file-storage.js';

/**
 * Almacenamiento de archivos. Por ahora usa una implementación provisional
 * que no guarda nada; la versión en disco de la #18 reemplaza este proveedor.
 */
@Module({
  providers: [{ provide: FILE_STORAGE, useClass: UnavailableFileStorage }],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
