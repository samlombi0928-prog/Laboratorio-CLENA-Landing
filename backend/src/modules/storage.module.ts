import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { FILE_STORAGE } from '../application/storage/ports/file-storage.js';
import type { EnvironmentVariables } from '../infrastructure/config/environment-variables.js';
import { DiskFileStorage } from '../infrastructure/storage/disk-file-storage.js';

type AppConfig = ConfigService<EnvironmentVariables, true>;

/**
 * Almacenamiento de archivos en disco. Las pruebas e2e reemplazan este módulo
 * por uno con InMemoryFileStorage.
 */
@Module({
  providers: [
    {
      provide: FILE_STORAGE,
      inject: [ConfigService],
      useFactory: (config: AppConfig) =>
        new DiskFileStorage(
          resolve(config.get('STORAGE_DIR', { infer: true })),
          config.get('PUBLIC_BASE_URL', { infer: true }),
        ),
    },
  ],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
