import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  FileStorage,
  ImageContentType,
  SaveFileInput,
  StoredFile,
} from '../../application/storage/ports/file-storage.js';
import { isValidStorageKey } from './storage-key.js';

const EXTENSIONS: Record<ImageContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/**
 * Guarda los archivos en una carpeta del disco (STORAGE_DIR). En producción esa
 * carpeta debe ser un volumen de Docker, o los archivos se pierden al recrear
 * el contenedor.
 */
export class DiskFileStorage implements FileStorage {
  private readonly publicBaseUrl: string;

  constructor(
    private readonly rootDir: string,
    publicBaseUrl: string,
  ) {
    this.publicBaseUrl = publicBaseUrl.replace(/\/+$/, '');
  }

  async save(input: SaveFileInput): Promise<StoredFile> {
    const key = `${input.folder}/${randomUUID()}.${EXTENSIONS[input.contentType]}`;
    const path = this.pathFor(key);
    const temporaryPath = `${path}.tmp`;

    await mkdir(dirname(path), { recursive: true });
    try {
      // Se escribe aparte y se mueve al final: renombrar es atómico, así que
      // nunca queda a la vista un archivo a medio escribir.
      await writeFile(temporaryPath, input.content);
      await rename(temporaryPath, path);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
    return { key, url: this.urlFor(key) };
  }

  async delete(key: string): Promise<void> {
    // force: true hace que borrar un archivo que ya no existe no sea un error.
    await rm(this.pathFor(key), { force: true });
  }

  urlFor(key: string): string {
    return `${this.publicBaseUrl}/archivos/${key}`;
  }

  /** Ruta en disco de una clave. Rechaza cualquier clave que no sea válida. */
  private pathFor(key: string): string {
    if (!isValidStorageKey(key)) {
      throw new Error(`Clave de archivo no válida: ${key}`);
    }
    return join(this.rootDir, key);
  }
}
