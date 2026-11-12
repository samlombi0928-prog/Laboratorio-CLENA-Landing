import { BusinessRuleError } from '../errors/domain-errors.js';
import {
  AgendaEvent,
  type CreateAgendaEventProps,
  EVENT_TITLE_MAX_LENGTH,
} from './agenda-event.js';
import { EventStatus } from './event-status.js';

const now = new Date('2026-11-07T12:00:00Z');

function validInput(
  overrides: Partial<CreateAgendaEventProps> = {},
): CreateAgendaEventProps {
  return {
    id: 'e-1',
    title: '  Noche de museos  ',
    description: '  Recorrido nocturno por el museo  ',
    location: '  Museo de la Aduana  ',
    startsAt: new Date('2026-11-20T23:00:00Z'),
    capacity: 30,
    publishFrom: new Date('2026-11-07T00:00:00Z'),
    publishUntil: new Date('2026-11-20T23:00:00Z'),
    now,
    ...overrides,
  };
}

function expectRuleError(fn: () => unknown, code: string): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(BusinessRuleError);
    expect((error as BusinessRuleError).code).toBe(code);
    return;
  }
  throw new Error(`Se esperaba el error ${code}`);
}

describe('AgendaEvent', () => {
  it('crea un evento con los textos sin espacios en los extremos', () => {
    const event = AgendaEvent.create(validInput());

    expect(event.title).toBe('Noche de museos');
    expect(event.description).toBe('Recorrido nocturno por el museo');
    expect(event.location).toBe('Museo de la Aduana');
    expect(event.capacity).toBe(30);
    expect(event.createdAt).toEqual(now);
    expect(event.updatedAt).toEqual(now);
  });

  it('la descripción es opcional', () => {
    const event = AgendaEvent.create(validInput({ description: undefined }));

    expect(event.description).toBe('');
  });

  it('exige título y lugar', () => {
    expectRuleError(
      () => AgendaEvent.create(validInput({ title: '   ' })),
      'TITULO_REQUERIDO',
    );
    expectRuleError(
      () => AgendaEvent.create(validInput({ location: '' })),
      'LUGAR_REQUERIDO',
    );
  });

  it('rechaza un título demasiado largo', () => {
    expectRuleError(
      () =>
        AgendaEvent.create(
          validInput({ title: 'a'.repeat(EVENT_TITLE_MAX_LENGTH + 1) }),
        ),
      'TITULO_DEMASIADO_LARGO',
    );
  });

  it('exige un cupo entero mayor que cero', () => {
    for (const capacity of [0, -5, 2.5]) {
      expectRuleError(
        () => AgendaEvent.create(validInput({ capacity })),
        'CUPO_NO_VALIDO',
      );
    }
  });

  it('no deja que la publicación termine antes de empezar', () => {
    expectRuleError(
      () =>
        AgendaEvent.create(
          validInput({
            publishFrom: new Date('2026-11-10T00:00:00Z'),
            publishUntil: new Date('2026-11-09T00:00:00Z'),
          }),
        ),
      'PERIODO_DE_PUBLICACION_NO_VALIDO',
    );
  });

  describe('isPublishedAt', () => {
    const event = AgendaEvent.create(validInput());

    it('está publicado dentro del periodo y antes de empezar', () => {
      expect(event.isPublishedAt(new Date('2026-11-15T12:00:00Z'))).toBe(true);
    });

    it('no está publicado antes del periodo', () => {
      expect(event.isPublishedAt(new Date('2026-11-06T23:59:59Z'))).toBe(false);
    });

    it('no está publicado cuando el evento ya empezó', () => {
      expect(event.isPublishedAt(new Date('2026-11-20T23:00:00Z'))).toBe(false);
    });

    it('no está publicado después del periodo aunque el evento no haya empezado', () => {
      const later = AgendaEvent.create(
        validInput({
          startsAt: new Date('2026-12-01T00:00:00Z'),
          publishUntil: new Date('2026-11-10T00:00:00Z'),
        }),
      );

      expect(later.isPublishedAt(new Date('2026-11-11T00:00:00Z'))).toBe(false);
    });
  });

  describe('statusAt', () => {
    const event = AgendaEvent.create(validInput());

    it('está pendiente antes de su periodo de publicación', () => {
      expect(event.statusAt(new Date('2026-11-06T23:59:59Z'))).toBe(
        EventStatus.Scheduled,
      );
    });

    it('está publicado desde el primer instante del periodo', () => {
      expect(event.statusAt(new Date('2026-11-07T00:00:00Z'))).toBe(
        EventStatus.Published,
      );
    });

    it('se cierra cuando el evento empieza', () => {
      expect(event.statusAt(new Date('2026-11-20T23:00:00Z'))).toBe(
        EventStatus.Closed,
      );
    });

    it('un evento que ya empezó queda cerrado aunque su publicación no haya empezado', () => {
      const odd = AgendaEvent.create(
        validInput({
          startsAt: new Date('2026-11-08T00:00:00Z'),
          publishFrom: new Date('2026-11-09T00:00:00Z'),
          publishUntil: new Date('2026-11-10T00:00:00Z'),
        }),
      );

      expect(odd.statusAt(new Date('2026-11-08T12:00:00Z'))).toBe(
        EventStatus.Closed,
      );
    });
  });

  describe('update', () => {
    const later = new Date('2026-11-08T12:00:00Z');

    it('cambia solo los campos que llegan y la fecha de actualización', () => {
      const event = AgendaEvent.create(validInput());

      event.update({ title: '  Noche de jazz  ', capacity: 50 }, later);

      expect(event.title).toBe('Noche de jazz');
      expect(event.capacity).toBe(50);
      expect(event.location).toBe('Museo de la Aduana');
      expect(event.createdAt).toEqual(now);
      expect(event.updatedAt).toEqual(later);
    });

    it('valida el periodo con las fechas nuevas y las que ya tenía', () => {
      const event = AgendaEvent.create(validInput());

      expectRuleError(
        () =>
          event.update(
            { publishUntil: new Date('2026-11-06T00:00:00Z') },
            later,
          ),
        'PERIODO_DE_PUBLICACION_NO_VALIDO',
      );
    });

    it('no cambia nada si algún dato es inválido', () => {
      const event = AgendaEvent.create(validInput());

      expectRuleError(
        () => event.update({ title: 'Otro', capacity: 0 }, later),
        'CUPO_NO_VALIDO',
      );
      expect(event.title).toBe('Noche de museos');
      expect(event.updatedAt).toEqual(now);
    });
  });
});
