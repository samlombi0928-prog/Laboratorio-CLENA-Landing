import { ServiceUnavailableException } from '@nestjs/common';
import type {
  FileStorage,
  SaveFileInput,
  StoredFile,
} from '../../application/storage/ports/file-storage.js';

/**
 * Implementación provisional de FileStorage mientras llega la versión en
 * disco (#18). Deja arrancar la API, pero responde 503 si se intenta subir un
 * archivo. Se reemplaza cambiando el proveedor en StorageModule.
 */
export class UnavailableFileStorage implements FileStorage {
  save(_input: SaveFileInput): Promise<StoredFile> {
    return Promise.reject(
      new ServiceUnavailableException({
        codigo: 'ALMACENAMIENTO_NO_DISPONIBLE',
        mensaje:
          'Todavía no se pueden subir imágenes. Cree el recorrido sin portada',
      }),
    );
  }

  delete(_key: string): Promise<void> {
    return Promise.resolve();
  }

  urlFor(key: string): string {
    return `/archivos/${key}`;
  }
}
