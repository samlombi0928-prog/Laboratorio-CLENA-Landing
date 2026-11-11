import { BusinessRuleError } from '../errors/domain-errors.js';
import {
  AgendaEvent,
  type CreateAgendaEventProps,
  EVENT_TITLE_MAX_LENGTH,
} from './agenda-event.js';

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
});
