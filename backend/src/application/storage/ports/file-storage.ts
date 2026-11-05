/** Tipos de imagen que acepta el sistema. */
export type ImageContentType = 'image/jpeg' | 'image/png';

/** Carpeta lógica donde queda cada archivo. */
export type StorageFolder = 'covers' | 'scenes';

export interface SaveFileInput {
  content: Uint8Array;
  contentType: ImageContentType;
  folder: StorageFolder;
}

export interface StoredFile {
  /** Identifica el archivo, por ejemplo covers/<uuid>.jpg. Es lo que se guarda en la base de datos. */
  key: string;
  /** Dirección pública para mostrar el archivo. No se guarda: se calcula con urlFor. */
  url: string;
}

/**
 * Puerto de almacenamiento de archivos. Los casos de uso dependen de esta
 * interfaz, no de dónde queden guardados los archivos.
 */
export interface FileStorage {
  save(input: SaveFileInput): Promise<StoredFile>;
  /** Borra el archivo. Si no existe, no falla. */
  delete(key: string): Promise<void>;
  urlFor(key: string): string;
}

export const FILE_STORAGE = Symbol('FileStorage');