// Primero: los decoradores de las variables de entorno la necesitan.
import 'reflect-metadata';
import { access, copyFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { validateEnvironment } from '../config/environment-variables.js';
import { isValidStorageKey } from '../storage/storage-key.js';
import dataSource from './data-source.js';
import { GALLERY_SEED_IMAGES } from './gallery-seed-data.js';

/** Carpeta con las fotos de ejemplo: backend/seed/galeria (junto a src y dist). */
const SEED_DIR = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'seed',
  'galeria',
);

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Copia el archivo con un nombre temporal y lo renombra, para no dejar uno a medias. */
async function copyAtomically(source: string, target: string): Promise<void> {
  const temporary = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  try {
    await copyFile(source, temporary);
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

/**
 * Carga las imágenes de ejemplo de la galería: copia las fotos a STORAGE_DIR y
 * agrega sus filas a gallery_images. Se puede correr las veces que haga falta:
 * lo que ya existe no se duplica, y si falta un archivo (por ejemplo porque se
 * perdió el volumen) se vuelve a copiar.
 *
 * Uso: npm run galeria:semilla
 */
async function seedGallery(): Promise<number> {
  const storageDir = resolve(validateEnvironment(process.env).STORAGE_DIR);

  await dataSource.initialize();
  try {
    let copiedFiles = 0;
    let insertedRows = 0;
    for (const [index, image] of GALLERY_SEED_IMAGES.entries()) {
      if (!isValidStorageKey(image.key)) {
        throw new Error(`Clave de archivo no válida: ${image.key}`);
      }
      const target = join(storageDir, image.key);
      if (!(await exists(target))) {
        await copyAtomically(join(SEED_DIR, image.file), target);
        copiedFiles += 1;
      }

      // La primera de la lista queda como la más reciente: se ven en este orden.
      const inserted: unknown[] = await dataSource.query(
        `INSERT INTO "gallery_images" ("id", "title", "alt_text", "image_key", "uploaded_by", "created_at")
         VALUES ($1, $2, $3, $4, NULL, now() - make_interval(mins => $5::int))
         ON CONFLICT DO NOTHING
         RETURNING "id"`,
        [image.id, image.title, image.altText, image.key, index],
      );
      insertedRows += inserted.length;
    }
    console.log(
      `Galería de ejemplo lista: ${insertedRows} imágenes nuevas en la base y ${copiedFiles} archivos copiados a ${storageDir}.`,
    );
    return 0;
  } finally {
    await dataSource.destroy();
  }
}

process.exitCode = await seedGallery();
