import { STORAGE_FOLDERS } from '../../application/storage/ports/file-storage.js';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/**
 * Forma exacta de una clave: <carpeta>/<uuid>.<jpg|png>. Al aceptar solo esto,
 * una clave no puede contener "..", "/" extra, "\" ni nada que haga salir al
 * archivo de la carpeta de almacenamiento (ataque de path traversal).
 */
const STORAGE_KEY = new RegExp(
  `^(?:${STORAGE_FOLDERS.join('|')})/${UUID}\\.(?:jpg|png)$`,
);

export function isValidStorageKey(key: string): boolean {
  return STORAGE_KEY.test(key);
}
