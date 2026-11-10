import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DiskFileStorage } from './disk-file-storage.js';
import { isValidStorageKey } from './storage-key.js';

const CONTENT = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

describe('DiskFileStorage', () => {
  let workDir: string;
  let rootDir: string;
  let storage: DiskFileStorage;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'clena-storage-'));
    rootDir = join(workDir, 'storage');
    storage = new DiskFileStorage(rootDir, 'http://localhost:3000');
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('guarda el archivo como <carpeta>/<uuid>.<extensión> y devuelve su clave y URL', async () => {
    const stored = await storage.save({
      content: CONTENT,
      contentType: 'image/png',
      folder: 'gallery',
    });

    expect(stored.key).toMatch(/^gallery\/[0-9a-f-]{36}\.png$/);
    expect(stored.url).toBe(`http://localhost:3000/archivos/${stored.key}`);
    expect(new Uint8Array(await readFile(join(rootDir, stored.key)))).toEqual(
      CONTENT,
    );
  });

  it('usa .jpg para image/jpeg y crea la carpeta si no existe', async () => {
    const stored = await storage.save({
      content: CONTENT,
      contentType: 'image/jpeg',
      folder: 'covers',
    });

    expect(stored.key).toMatch(/^covers\/.+\.jpg$/);
    expect(await readdir(join(rootDir, 'covers'))).toHaveLength(1);
  });

  it('no deja archivos .tmp después de guardar', async () => {
    await storage.save({
      content: CONTENT,
      contentType: 'image/png',
      folder: 'scenes',
    });

    const files = await readdir(join(rootDir, 'scenes'));
    expect(files.filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('cada archivo recibe una clave distinta', async () => {
    const input = {
      content: CONTENT,
      contentType: 'image/png',
      folder: 'gallery',
    } as const;

    const [a, b] = await Promise.all([
      storage.save(input),
      storage.save(input),
    ]);

    expect(a.key).not.toBe(b.key);
  });

  it('ignora la barra final de PUBLIC_BASE_URL al armar la URL', () => {
    const withSlash = new DiskFileStorage(rootDir, 'https://clena.co/api/');

    const key = `gallery/${randomUUID()}.png`;
    expect(withSlash.urlFor(key)).toBe(`https://clena.co/api/archivos/${key}`);
  });

  it('borra el archivo, y no falla si ya no existe', async () => {
    const { key } = await storage.save({
      content: CONTENT,
      contentType: 'image/png',
      folder: 'gallery',
    });

    await storage.delete(key);
    await storage.delete(key);

    expect(existsSync(join(rootDir, key))).toBe(false);
  });

  it('si no se puede guardar, no deja el .tmp y propaga el error', async () => {
    // Un archivo donde debería ir la carpeta hace fallar mkdir.
    await writeFile(rootDir, 'estorbo');

    await expect(
      storage.save({
        content: CONTENT,
        contentType: 'image/png',
        folder: 'gallery',
      }),
    ).rejects.toThrow();
  });

  describe('claves que intentan salir de la carpeta', () => {
    const invalidKeys = [
      '../secreto.png',
      'gallery/../../secreto.png',
      `gallery/../${randomUUID()}.png`,
      `/etc/${randomUUID()}.png`,
      `otra/${randomUUID()}.png`,
      `gallery/${randomUUID()}.png.tmp`,
      `gallery/${randomUUID()}.svg`,
      `gallery\\${randomUUID()}.png`,
      `gallery/${randomUUID()}.png\n`,
      'gallery/no-es-un-uuid.png',
      '',
    ];

    it.each(invalidKeys)(
      'rechaza %j al borrar y no toca nada fuera',
      async (key) => {
        const outside = join(workDir, 'secreto.png');
        await writeFile(outside, 'no me borres');

        await expect(storage.delete(key)).rejects.toThrow(
          'Clave de archivo no válida',
        );
        expect(existsSync(outside)).toBe(true);
      },
    );
  });
});

describe('isValidStorageKey', () => {
  it('acepta solo <carpeta conocida>/<uuid>.<jpg|png>', () => {
    const id = randomUUID();

    expect(isValidStorageKey(`covers/${id}.jpg`)).toBe(true);
    expect(isValidStorageKey(`scenes/${id}.png`)).toBe(true);
    expect(isValidStorageKey(`gallery/${id}.png`)).toBe(true);
    expect(isValidStorageKey(`docs/${id}.png`)).toBe(false);
    expect(isValidStorageKey(`gallery/${id}.jpeg`)).toBe(false);
    expect(isValidStorageKey(`gallery/${id.toUpperCase()}.png`)).toBe(false);
  });
});
