import { InMemoryFileStorage } from '../../../test/support/in-memory-file-storage.js';
import { InMemoryGalleryImageRepository } from '../../../test/support/in-memory-gallery-image-repository.js';
import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import { DeleteGalleryImageUseCase } from './delete-gallery-image.use-case.js';
import { ListGalleryImagesUseCase } from './list-gallery-images.use-case.js';
import {
  MAX_GALLERY_IMAGE_BYTES,
  UploadGalleryImageUseCase,
} from './upload-gallery-image.use-case.js';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]);

function setup() {
  let current = new Date('2026-11-07T12:00:00.000Z');
  let ids = 0;
  const images = new InMemoryGalleryImageRepository();
  const storage = new InMemoryFileStorage();
  const upload = new UploadGalleryImageUseCase(images, storage, {
    now: () => current,
    generateId: () => `g-${++ids}`,
  });
  return {
    images,
    storage,
    upload,
    list: new ListGalleryImagesUseCase(images, storage),
    remove: new DeleteGalleryImageUseCase(images, storage),
    advance: (ms: number) => {
      current = new Date(current.getTime() + ms);
    },
    /** Sube una imagen válida y deja pasar un segundo para ordenarlas por fecha. */
    add: async (title: string, advanceMs = 1000) => {
      const view = await upload.execute({
        uploadedBy: 'u-1',
        title,
        altText: `Texto de ${title}`,
        image: PNG,
      });
      current = new Date(current.getTime() + advanceMs);
      return view;
    },
  };
}

describe('UploadGalleryImageUseCase', () => {
  it('sube una imagen JPG o PNG con título y texto alternativo', async () => {
    const { upload, images, storage } = setup();

    const view = await upload.execute({
      uploadedBy: 'u-1',
      title: ' Fachada ',
      altText: ' Fachada de la Aduana ',
      image: JPG,
    });

    const saved = images.images.get('g-1');
    expect(saved?.uploadedBy).toBe('u-1');
    expect(saved?.imageKey).toMatch(/^gallery\/.+\.jpg$/);
    expect(storage.files.get(saved?.imageKey ?? '')).toEqual(JPG);
    expect(view).toEqual({
      id: 'g-1',
      title: 'Fachada',
      altText: 'Fachada de la Aduana',
      imageUrl: storage.urlFor(saved?.imageKey ?? ''),
      createdAt: new Date('2026-11-07T12:00:00.000Z'),
    });
  });

  it('detecta el tipo por los bytes: un PNG queda como .png', async () => {
    const { upload, images } = setup();

    await upload.execute({
      uploadedBy: 'u-1',
      title: 'Patio',
      altText: 'Patio interior',
      image: PNG,
    });

    expect(images.images.get('g-1')?.imageKey).toMatch(/\.png$/);
  });

  it('rechaza un archivo que no es JPG ni PNG y explica por qué, sin guardar nada', async () => {
    const { upload, images, storage } = setup();

    await expect(
      upload.execute({
        uploadedBy: 'u-1',
        title: 'Falsa',
        altText: 'Imagen falsa',
        image: new TextEncoder().encode('<svg onload="alert(1)"></svg>'),
      }),
    ).rejects.toMatchObject({
      code: 'TIPO_DE_IMAGEN_NO_VALIDO',
      message: 'La imagen debe ser un archivo JPG o PNG',
    });
    expect(storage.files.size).toBe(0);
    expect(images.images.size).toBe(0);
  });

  it('rechaza una imagen de más de 10 MB y explica por qué, sin guardar nada', async () => {
    const { upload, storage } = setup();
    const big = new Uint8Array(MAX_GALLERY_IMAGE_BYTES + 1);
    big.set(PNG);

    await expect(
      upload.execute({
        uploadedBy: 'u-1',
        title: 'Grande',
        altText: 'Imagen grande',
        image: big,
      }),
    ).rejects.toMatchObject({
      code: 'ARCHIVO_DEMASIADO_GRANDE',
      message: 'La imagen puede pesar máximo 10 MB',
    });
    expect(storage.files.size).toBe(0);
  });

  it('acepta una imagen de exactamente 10 MB', async () => {
    const { upload, storage } = setup();
    const exact = new Uint8Array(MAX_GALLERY_IMAGE_BYTES);
    exact.set(PNG);

    await upload.execute({
      uploadedBy: 'u-1',
      title: 'Justa',
      altText: 'Imagen justa',
      image: exact,
    });

    expect(storage.files.size).toBe(1);
  });

  it.each([undefined, new Uint8Array(0)])(
    'rechaza cuando no hay imagen (%j)',
    async (image) => {
      const { upload } = setup();

      await expect(
        upload.execute({
          uploadedBy: 'u-1',
          title: 'Sin imagen',
          altText: 'Nada',
          image,
        }),
      ).rejects.toMatchObject({ code: 'IMAGEN_REQUERIDA' });
    },
  );

  it('si el título o el texto alternativo no son válidos, no guarda la imagen', async () => {
    const { upload, storage } = setup();

    await expect(
      upload.execute({
        uploadedBy: 'u-1',
        title: '  ',
        altText: 'Algo',
        image: PNG,
      }),
    ).rejects.toMatchObject({ code: 'TITULO_REQUERIDO' });
    await expect(
      upload.execute({
        uploadedBy: 'u-1',
        title: 'Algo',
        altText: '',
        image: PNG,
      }),
    ).rejects.toMatchObject({ code: 'TEXTO_ALTERNATIVO_REQUERIDO' });
    expect(storage.files.size).toBe(0);
  });

  it('si falla guardar en la base de datos, borra el archivo que ya subió', async () => {
    const { upload, storage, images } = setup();
    vi.spyOn(images, 'save').mockRejectedValueOnce(new Error('sin base'));

    await expect(
      upload.execute({
        uploadedBy: 'u-1',
        title: 'Falla',
        altText: 'Falla',
        image: PNG,
      }),
    ).rejects.toThrow('sin base');
    expect(storage.files.size).toBe(0);
  });

  it('usa un id aleatorio y la fecha actual por defecto', async () => {
    const upload = new UploadGalleryImageUseCase(
      new InMemoryGalleryImageRepository(),
      new InMemoryFileStorage(),
    );

    const view = await upload.execute({
      uploadedBy: 'u-1',
      title: 'Hoy',
      altText: 'Hoy',
      image: PNG,
    });

    expect(view.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(view.createdAt).toBeInstanceOf(Date);
  });
});

describe('ListGalleryImagesUseCase', () => {
  it('con la galería vacía devuelve una página vacía', async () => {
    const { list } = setup();

    await expect(list.execute()).resolves.toEqual({
      items: [],
      page: 1,
      pageSize: 12,
      total: 0,
      totalPages: 0,
    });
  });

  it('lista por defecto las más recientes primero', async () => {
    const { list, add } = setup();
    await add('Primera');
    await add('Segunda');
    await add('Tercera');

    const page = await list.execute();

    expect(page.items.map((image) => image.title)).toEqual([
      'Tercera',
      'Segunda',
      'Primera',
    ]);
  });

  it('puede listar las más antiguas primero', async () => {
    const { list, add } = setup();
    await add('Primera');
    await add('Segunda');

    const page = await list.execute({ order: 'oldest' });

    expect(page.items.map((image) => image.title)).toEqual([
      'Primera',
      'Segunda',
    ]);
  });

  it('pagina: cada página trae su parte y el total de páginas', async () => {
    const { list, add } = setup();
    for (const title of ['A', 'B', 'C', 'D', 'E']) await add(title);

    const first = await list.execute({ page: 1, pageSize: 2 });
    const third = await list.execute({ page: 3, pageSize: 2 });
    const beyond = await list.execute({ page: 4, pageSize: 2 });

    expect(first.items.map((i) => i.title)).toEqual(['E', 'D']);
    expect(third.items.map((i) => i.title)).toEqual(['A']);
    expect(first).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 5,
      totalPages: 3,
    });
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(5);
  });

  it('busca por título sin distinguir mayúsculas y recorta los espacios', async () => {
    const { list, add } = setup();
    await add('Fachada de la Aduana');
    await add('Patio interior');
    await add('Sala de la ADUANA');

    const page = await list.execute({ search: '  aduana ' });

    expect(page.items.map((i) => i.title).sort()).toEqual([
      'Fachada de la Aduana',
      'Sala de la ADUANA',
    ]);
    expect(page.total).toBe(2);
  });

  it('una búsqueda vacía no filtra', async () => {
    const { list, add } = setup();
    await add('A');
    await add('B');

    expect((await list.execute({ search: '   ' })).total).toBe(2);
  });

  it('corrige página y tamaño fuera de rango', async () => {
    const { list, add } = setup();
    await add('A');

    const page = await list.execute({ page: -3, pageSize: 5000 });

    expect(page).toMatchObject({ page: 1, pageSize: 50 });
  });

  it('cada imagen trae la URL calculada desde su clave', async () => {
    const { list, add, storage, images } = setup();
    await add('Con URL');

    const [item] = (await list.execute()).items;

    const key = images.images.get('g-1')?.imageKey ?? '';
    expect(item?.imageUrl).toBe(storage.urlFor(key));
  });
});

describe('DeleteGalleryImageUseCase', () => {
  it('elimina la imagen de la galería y su archivo del almacenamiento', async () => {
    const { add, remove, images, storage, list } = setup();
    await add('Para borrar');
    await add('Se queda');

    await remove.execute('g-1');

    expect(images.images.has('g-1')).toBe(false);
    expect(storage.files.size).toBe(1);
    expect((await list.execute()).items.map((i) => i.title)).toEqual([
      'Se queda',
    ]);
  });

  it('si la imagen no existe responde 404 y no borra nada', async () => {
    const { add, remove, storage } = setup();
    await add('Existe');

    await expect(remove.execute('no-existe')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
    expect(storage.files.size).toBe(1);
  });
});
