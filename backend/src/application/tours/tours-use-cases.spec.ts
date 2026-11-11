import { InMemoryFileStorage } from '../../../test/support/in-memory-file-storage.js';
import { InMemoryTourRepository } from '../../../test/support/in-memory-tour-repository.js';
import {
  BusinessRuleError,
  ResourceNotFoundError,
} from '../../domain/errors/domain-errors.js';
import { TourStatus } from '../../domain/tours/tour-status.js';
import { CreateTourUseCase, MAX_COVER_BYTES } from './create-tour.use-case.js';
import { GetTourUseCase } from './get-tour.use-case.js';
import { ListMyToursUseCase } from './list-my-tours.use-case.js';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]);

function setup() {
  let current = new Date('2026-11-05T12:00:00.000Z');
  let ids = 0;
  const tours = new InMemoryTourRepository();
  const storage = new InMemoryFileStorage();
  return {
    tours,
    storage,
    advance: (ms: number) => {
      current = new Date(current.getTime() + ms);
    },
    create: new CreateTourUseCase(tours, storage, {
      now: () => current,
      generateId: () => `t-${++ids}`,
    }),
    listMine: new ListMyToursUseCase(tours, storage),
    get: new GetTourUseCase(tours, storage),
  };
}

describe('CreateTourUseCase', () => {
  it('crea un borrador sin portada', async () => {
    const { create, tours } = setup();

    const view = await create.execute({
      ownerId: 'u-1',
      title: ' Mi recorrido ',
      description: 'Descripción',
    });

    expect(view).toEqual({
      id: 't-1',
      title: 'Mi recorrido',
      description: 'Descripción',
      status: TourStatus.Draft,
      coverUrl: null,
      createdAt: new Date('2026-11-05T12:00:00.000Z'),
      updatedAt: new Date('2026-11-05T12:00:00.000Z'),
    });
    expect(tours.tours.get('t-1')?.ownerId).toBe('u-1');
  });

  it('guarda la portada en la carpeta covers con el tipo que dicen sus bytes', async () => {
    const { create, storage, tours } = setup();

    const view = await create.execute({
      ownerId: 'u-1',
      title: 'Con portada',
      cover: JPG,
    });

    const coverKey = tours.tours.get('t-1')?.coverKey;
    expect(coverKey).toMatch(/^covers\/.+\.jpg$/);
    expect(storage.files.get(coverKey ?? '')).toEqual(JPG);
    expect(view.coverUrl).toBe(storage.urlFor(coverKey ?? ''));
  });

  it('rechaza una portada que no es JPG ni PNG, sin guardar nada', async () => {
    const { create, storage, tours } = setup();

    await expect(
      create.execute({
        ownerId: 'u-1',
        title: 'Falsa',
        cover: new TextEncoder().encode('<svg onload="alert(1)"></svg>'),
      }),
    ).rejects.toMatchObject({ code: 'TIPO_DE_IMAGEN_NO_VALIDO' });
    expect(storage.files.size).toBe(0);
    expect(tours.tours.size).toBe(0);
  });

  it('rechaza una portada de más de 5 MB', async () => {
    const { create, storage } = setup();
    const big = new Uint8Array(MAX_COVER_BYTES + 1);
    big.set(PNG);

    await expect(
      create.execute({ ownerId: 'u-1', title: 'Grande', cover: big }),
    ).rejects.toMatchObject({ code: 'ARCHIVO_DEMASIADO_GRANDE' });
    expect(storage.files.size).toBe(0);
  });

  it('si el título no es válido, no guarda la portada', async () => {
    const { create, storage } = setup();

    await expect(
      create.execute({ ownerId: 'u-1', title: '  ', cover: PNG }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
    expect(storage.files.size).toBe(0);
  });

  it('si falla guardar el recorrido, borra la portada que ya subió', async () => {
    const { create, storage, tours } = setup();
    vi.spyOn(tours, 'save').mockRejectedValueOnce(new Error('sin base'));

    await expect(
      create.execute({ ownerId: 'u-1', title: 'Falla', cover: PNG }),
    ).rejects.toThrow('sin base');
    expect(storage.files.size).toBe(0);
  });

  it('usa un id aleatorio y la fecha actual por defecto', async () => {
    const tours = new InMemoryTourRepository();
    const create = new CreateTourUseCase(tours, new InMemoryFileStorage());

    const view = await create.execute({ ownerId: 'u-1', title: 'Hoy' });

    expect(view.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(view.createdAt).toBeInstanceOf(Date);
  });
});

describe('ListMyToursUseCase', () => {
  it('devuelve solo los recorridos del usuario, el más reciente primero', async () => {
    const { create, listMine, advance } = setup();
    await create.execute({ ownerId: 'u-1', title: 'Primero' });
    advance(1000);
    await create.execute({ ownerId: 'u-2', title: 'Ajeno' });
    advance(1000);
    await create.execute({ ownerId: 'u-1', title: 'Segundo' });

    const mine = await listMine.execute('u-1');

    expect(mine.items.map((tour) => tour.title)).toEqual([
      'Segundo',
      'Primero',
    ]);
    expect(mine.total).toBe(2);
    expect((await listMine.execute('u-3')).items).toEqual([]);
  });

  it('pagina los recorridos', async () => {
    const { create, listMine, advance } = setup();
    for (const title of ['Uno', 'Dos', 'Tres']) {
      await create.execute({ ownerId: 'u-1', title });
      advance(1000);
    }

    const second = await listMine.execute('u-1', { page: 2, pageSize: 2 });

    expect(second).toMatchObject({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    });
    expect(second.items.map((tour) => tour.title)).toEqual(['Uno']);
  });
});

describe('GetTourUseCase', () => {
  it('el creador ve su borrador', async () => {
    const { create, get } = setup();
    await create.execute({ ownerId: 'u-1', title: 'Borrador' });

    await expect(get.execute('t-1', 'u-1')).resolves.toMatchObject({
      title: 'Borrador',
    });
  });

  it('un borrador ajeno o sin sesión responde como si no existiera', async () => {
    const { create, get } = setup();
    await create.execute({ ownerId: 'u-1', title: 'Borrador' });

    await expect(get.execute('t-1', 'u-2')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
    await expect(get.execute('t-1', null)).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
    await expect(get.execute('no-existe', 'u-1')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
