import { describe, expect, it } from 'vitest';
import { InMemorySectionItemRepository } from '../../../test/support/in-memory-section-item-repository.js';
import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import { SectionKind } from '../../domain/sections/section-item.js';
import { CreateSectionItemUseCase } from './create-section-item.use-case.js';
import { DeleteSectionItemUseCase } from './delete-section-item.use-case.js';
import { ListSectionItemsUseCase } from './list-section-items.use-case.js';
import { UpdateSectionItemUseCase } from './update-section-item.use-case.js';

function setup() {
  const repository = new InMemorySectionItemRepository();
  let time = new Date('2026-11-07T10:00:00Z').getTime();
  let counter = 0;
  const now = () => new Date((time += 1000));
  return {
    repository,
    create: new CreateSectionItemUseCase(repository, {
      now,
      generateId: () => `id-${++counter}`,
    }),
    update: new UpdateSectionItemUseCase(repository, { now }),
    remove: new DeleteSectionItemUseCase(repository),
    list: new ListSectionItemsUseCase(repository),
  };
}

describe('CreateSectionItemUseCase', () => {
  it('guarda el elemento publicado y de primero si no se indica otra cosa', async () => {
    const { create, repository } = setup();

    const item = await create.execute({
      kind: SectionKind.Schedule,
      title: 'Lunes a viernes',
      description: '8:00 a. m. a 5:00 p. m.',
    });

    expect(item.published).toBe(true);
    expect(item.order).toBe(0);
    expect(repository.items.get(item.id)).toBe(item);
  });

  it('no guarda nada si los datos son inválidos', async () => {
    const { create, repository } = setup();

    await expect(
      create.execute({
        kind: SectionKind.Service,
        title: '',
        description: 'x',
      }),
    ).rejects.toMatchObject({ code: 'TITULO_REQUERIDO' });
    expect(repository.items.size).toBe(0);
  });
});

describe('ListSectionItemsUseCase', () => {
  async function withItems() {
    const context = setup();
    await context.create.execute({
      kind: SectionKind.Service,
      title: 'B',
      description: 'x',
      order: 2,
    });
    await context.create.execute({
      kind: SectionKind.Service,
      title: 'A',
      description: 'x',
      order: 1,
    });
    await context.create.execute({
      kind: SectionKind.Service,
      title: 'Oculto',
      description: 'x',
      published: false,
    });
    await context.create.execute({
      kind: SectionKind.Schedule,
      title: 'Sábados',
      description: 'x',
    });
    await context.create.execute({
      kind: SectionKind.Space,
      title: 'Museo',
      description: 'x',
    });
    return context;
  }

  it('en la landing muestra solo lo publicado, ordenado por sección y por orden', async () => {
    const { list } = await withItems();

    const page = await list.execute({ onlyPublished: true });

    expect(page.items.map((item) => item.title)).toEqual([
      'Museo',
      'A',
      'B',
      'Sábados',
    ]);
    expect(page.total).toBe(4);
  });

  it('en el panel incluye lo oculto y filtra por sección', async () => {
    const { list } = await withItems();

    const page = await list.execute({
      onlyPublished: false,
      kind: SectionKind.Service,
    });

    expect(page.items.map((item) => item.title)).toEqual(['Oculto', 'A', 'B']);
  });

  it('pagina los resultados', async () => {
    const { list } = await withItems();

    const page = await list.execute({
      onlyPublished: false,
      page: 2,
      pageSize: 2,
    });

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(5);
    expect(page.totalPages).toBe(3);
  });
});

describe('UpdateSectionItemUseCase', () => {
  it('cambia los campos indicados y la fecha de modificación', async () => {
    const { create, update } = setup();
    const item = await create.execute({
      kind: SectionKind.Service,
      title: 'Wifi',
      description: 'Gratis',
    });

    const updated = await update.execute(item.id, {
      published: false,
      description: 'Gratis en todo el edificio',
    });

    expect(updated.published).toBe(false);
    expect(updated.description).toBe('Gratis en todo el edificio');
    expect(updated.title).toBe('Wifi');
    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      updated.createdAt.getTime(),
    );
  });

  it('avisa si el elemento no existe', async () => {
    const { update } = setup();

    await expect(
      update.execute('no-existe', { title: 'x' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

describe('DeleteSectionItemUseCase', () => {
  it('elimina el elemento', async () => {
    const { create, remove, repository } = setup();
    const item = await create.execute({
      kind: SectionKind.Space,
      title: 'Café',
      description: 'x',
    });

    await remove.execute(item.id);

    expect(repository.items.has(item.id)).toBe(false);
  });

  it('avisa si el elemento no existe', async () => {
    const { remove } = setup();

    await expect(remove.execute('no-existe')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
