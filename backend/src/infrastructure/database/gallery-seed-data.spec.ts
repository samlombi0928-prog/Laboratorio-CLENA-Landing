import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isValidStorageKey } from '../storage/storage-key.js';
import { GALLERY_SEED_IMAGES } from './gallery-seed-data.js';

const SEED_DIR = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'seed',
  'galeria',
);
const MAX_BYTES = 10 * 1024 * 1024;

describe('imágenes de ejemplo de la galería', () => {
  it('hay más de una página de 12 para poder probar la paginación', () => {
    expect(GALLERY_SEED_IMAGES.length).toBeGreaterThan(12);
  });

  it('cada clave de almacenamiento es válida y no se repite', () => {
    const keys = GALLERY_SEED_IMAGES.map((image) => image.key);
    for (const key of keys) {
      expect(isValidStorageKey(key), key).toBe(true);
    }
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('los ids y los archivos no se repiten', () => {
    const ids = GALLERY_SEED_IMAGES.map((image) => image.id);
    const files = GALLERY_SEED_IMAGES.map((image) => image.file);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(files).size).toBe(files.length);
  });

  it('el título y el texto alternativo respetan los límites de la galería', () => {
    for (const image of GALLERY_SEED_IMAGES) {
      expect(image.title.trim().length, image.file).toBeGreaterThan(0);
      expect(image.title.length, image.file).toBeLessThanOrEqual(120);
      expect(image.altText.trim().length, image.file).toBeGreaterThan(0);
      expect(image.altText.length, image.file).toBeLessThanOrEqual(250);
    }
  });

  it('cada archivo existe, es un JPG y no pasa del límite de 10 MB', () => {
    for (const image of GALLERY_SEED_IMAGES) {
      const content = readFileSync(resolve(SEED_DIR, image.file));
      // Un JPG empieza con los bytes FF D8 FF.
      expect([...content.subarray(0, 3)], image.file).toEqual([
        0xff, 0xd8, 0xff,
      ]);
      expect(content.length, image.file).toBeLessThanOrEqual(MAX_BYTES);
      expect(image.key.endsWith('.jpg'), image.key).toBe(true);
    }
  });
});
