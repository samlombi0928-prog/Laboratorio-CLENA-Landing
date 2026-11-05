import { randomUUID } from 'node:crypto';
import type {
  FileStorage,
  SaveFileInput,
  StoredFile,
} from '../../src/application/storage/file-storage.js';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png' } as const;

/** Guarda los archivos en un Map para probar sin tocar el disco. */
export class InMemoryFileStorage implements FileStorage {
  readonly files = new Map<string, Uint8Array>();

  save(input: SaveFileInput): Promise<StoredFile> {
    const extension = EXTENSIONS[input.contentType];
    const key = `${input.folder}/${randomUUID()}.${extension}`;
    this.files.set(key, input.content);
    return Promise.resolve({ key, url: this.urlFor(key) });
  }

  delete(key: string): Promise<void> {
    this.files.delete(key);
    return Promise.resolve();
  }

  urlFor(key: string): string {
    return `/archivos/${key}`;
  }
}