import { describe, expect, it } from 'vitest';
import { InMemoryFileStorage } from '../../../test/support/in-memory-file-storage.js';
describe('FileStorage en memoria', () => {
  const content = new Uint8Array([1, 2, 3]);

  it('guarda el archivo y devuelve su clave y su URL', async () => {
    const storage = new InMemoryFileStorage();

    const stored = await storage.save({
      content,
      contentType: 'image/jpeg',
      folder: 'covers',
    });

    expect(stored.key).toMatch(/^covers\/[0-9a-f-]{36}\.jpg$/);
    expect(stored.url).toBe(`/archivos/${stored.key}`);
    expect(storage.files.get(stored.key)).toEqual(content);
  });

  it('borra el archivo, y no falla si ya no existe', async () => {
    const storage = new InMemoryFileStorage();
    const { key } = await storage.save({
      content,
      contentType: 'image/png',
      folder: 'scenes',
    });

    await storage.delete(key);
    await storage.delete(key);

    expect(storage.files.has(key)).toBe(false);
  });
});