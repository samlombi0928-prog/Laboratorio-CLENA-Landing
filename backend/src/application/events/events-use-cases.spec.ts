import { describe, expect, it } from 'vitest';
import { InMemoryEventRepository } from '../../../test/support/in-memory-event-repository.js';
import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import { EventStatus } from '../../domain/events/event-status.js';
import {
  type CreateEventInput,
  CreateEventUseCase,
} from './create-event.use-case.js';
import { DeleteEventUseCase } from './delete-event.use-case.js';
import { ListEventsUseCase } from './list-events.use-case.js';
import { UpdateEventUseCase } from './update-event.use-case.js';

const NOW = new Date('2026-11-11T12:00:00Z');
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

function eventInput(
  overrides: Partial<CreateEventInput> = {},
): CreateEventInput {
  return {
    title: 'Noche de jazz en la Aduana',
    location: 'Patio central',
    startsAt: days(10),
    capacity: 40,
    publishFrom: days(-1),
    publishUntil: days(10),
    ...overrides,
  };
}

function setup() {
  const repository = new InMemoryEventRepository();
  let counter = 0;
  const now = () => NOW;
  return {
    repository,
    create: new CreateEventUseCase(repository, {
      now,
      generateId: () => `evento-${++counter}`,
    }),
    update: new UpdateEventUseCase(repository, { now }),
    remove: new DeleteEventUseCase(repository),
    list: new ListEventsUseCase(repository, { now }),
  };
}

describe('CreateEventUseCase', () => {
  it('guarda el evento y lo devuelve con su estado', async () => {
    const { create, repository } = setup();

    const event = await create.execute(eventInput());

    expect(event).toMatchObject({
      id: 'evento-1',
      title: 'Noche de jazz en la Aduana',
      status: EventStatus.Published,
    });
    expect(repository.events.has('evento-1')).toBe(true);
  });

  it('no guarda nada si el periodo de publicación no es válido', async () => {
    const { create, repository } = setup();

    await expect(
      create.execute(
        eventInput({ publishFrom: days(2), publishUntil: days(1) }),
      ),
    ).rejects.toMatchObject({ code: 'PERIODO_DE_PUBLICACION_NO_VALIDO' });
    expect(repository.events.size).toBe(0);
  });
});

describe('ListEventsUseCase', () => {
  async function withAgenda() {
    const context = setup();
    await context.create.execute(
      eventInput({
        title: 'Feria del libro',
        startsAt: days(20),
        publishUntil: days(20),
      }),
    );
    await context.create.execute(
      eventInput({
        title: 'Taller de fotografía',
        startsAt: days(5),
        publishUntil: days(5),
      }),
    );
    await context.create.execute(
      eventInput({
        title: 'Visita al Archivo',
        publishFrom: days(7),
        publishUntil: days(30),
        startsAt: days(30),
      }),
    );
    await context.create.execute(
      eventInput({
        title: 'Conversatorio',
        publishFrom: days(-15),
        publishUntil: days(-3),
        startsAt: days(-3),
      }),
    );
    return context;
  }

  it('la agenda pública solo muestra los publicados, del más próximo al más lejano', async () => {
    const { list } = await withAgenda();

    const page = await list.execute({ onlyPublished: true });

    expect(page.items.map((e) => e.title)).toEqual([
      'Taller de fotografía',
      'Feria del libro',
    ]);
    expect(page.total).toBe(2);
  });

  it('la agenda pública ignora el filtro de estado', async () => {
    const { list } = await withAgenda();

    const page = await list.execute({
      onlyPublished: true,
      status: EventStatus.Closed,
    });

    expect(page.items.every((e) => e.status === EventStatus.Published)).toBe(
      true,
    );
  });

  it('el panel ve todos y puede filtrar por estado', async () => {
    const { list } = await withAgenda();

    const all = await list.execute({ onlyPublished: false });
    const scheduled = await list.execute({
      onlyPublished: false,
      status: EventStatus.Scheduled,
    });
    const closed = await list.execute({
      onlyPublished: false,
      status: EventStatus.Closed,
    });

    expect(all.total).toBe(4);
    expect(scheduled.items.map((e) => e.title)).toEqual(['Visita al Archivo']);
    expect(closed.items.map((e) => e.title)).toEqual(['Conversatorio']);
  });

  it('busca en el título y el lugar sin importar mayúsculas', async () => {
    const { list } = await withAgenda();

    const byTitle = await list.execute({
      onlyPublished: false,
      search: '  FERIA ',
    });
    const byPlace = await list.execute({
      onlyPublished: false,
      search: 'patio',
    });

    expect(byTitle.items.map((e) => e.title)).toEqual(['Feria del libro']);
    expect(byPlace.total).toBe(4);
  });

  it('pagina los resultados', async () => {
    const { list } = await withAgenda();

    const page = await list.execute({
      onlyPublished: false,
      page: 2,
      pageSize: 3,
    });

    expect(page.items).toHaveLength(1);
    expect(page.totalPages).toBe(2);
  });
});

describe('UpdateEventUseCase', () => {
  it('cambia los datos y recalcula el estado', async () => {
    const { create, update } = setup();
    const created = await create.execute(eventInput());

    const updated = await update.execute(created.id, {
      capacity: 60,
      publishFrom: days(3),
    });

    expect(updated.capacity).toBe(60);
    expect(updated.status).toBe(EventStatus.Scheduled);
  });

  it('falla si el evento no existe', async () => {
    const { update } = setup();

    await expect(
      update.execute('no-existe', { capacity: 5 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

describe('DeleteEventUseCase', () => {
  it('elimina el evento', async () => {
    const { create, remove, repository } = setup();
    const created = await create.execute(eventInput());

    await remove.execute(created.id);

    expect(repository.events.size).toBe(0);
  });

  it('falla si el evento no existe', async () => {
    const { remove } = setup();

    await expect(remove.execute('no-existe')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
