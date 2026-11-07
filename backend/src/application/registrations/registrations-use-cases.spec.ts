import { InMemoryEventRepository } from '../../../test/support/in-memory-event-repository.js';
import { InMemoryMailer } from '../../../test/support/in-memory-mailer.js';
import { InMemoryRegistrationRepository } from '../../../test/support/in-memory-registration-repository.js';
import { AgendaEvent } from '../../domain/events/agenda-event.js';
import {
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '../../domain/errors/domain-errors.js';
import { ListEventRegistrationsUseCase } from './list-event-registrations.use-case.js';
import {
  EVENT_FULL,
  type RegisterForEventInput,
  RegisterForEventUseCase,
} from './register-for-event.use-case.js';

const now = new Date('2026-11-10T15:00:00Z');

function event(overrides: Partial<{ id: string; capacity: number }> = {}) {
  return AgendaEvent.create({
    id: overrides.id ?? 'e-1',
    title: 'Noche de museos',
    location: 'Museo de la Aduana',
    startsAt: new Date('2026-11-20T23:00:00Z'),
    capacity: overrides.capacity ?? 2,
    publishFrom: new Date('2026-11-07T00:00:00Z'),
    publishUntil: new Date('2026-11-20T23:00:00Z'),
    now: new Date('2026-11-07T00:00:00Z'),
  });
}

function input(
  overrides: Partial<RegisterForEventInput> = {},
): RegisterForEventInput {
  return {
    eventId: 'e-1',
    name: 'Ana Pérez',
    email: 'ana@correo.com',
    acceptsPrivacyNotice: true,
    ...overrides,
  };
}

describe('Inscripciones', () => {
  let events: InMemoryEventRepository;
  let registrations: InMemoryRegistrationRepository;
  let mailer: InMemoryMailer;
  let register: RegisterForEventUseCase;
  let ids: number;

  beforeEach(async () => {
    events = new InMemoryEventRepository();
    registrations = new InMemoryRegistrationRepository();
    mailer = new InMemoryMailer();
    ids = 0;
    register = new RegisterForEventUseCase(events, registrations, mailer, {
      now: () => now,
      generateId: () => `r-${++ids}`,
    });
    await events.save(event());
  });

  describe('RegisterForEventUseCase', () => {
    it('inscribe y envía el correo de confirmación con la fecha en hora de Colombia', async () => {
      const result = await register.execute(input());

      expect(result).toEqual({
        id: 'r-1',
        eventId: 'e-1',
        eventTitle: 'Noche de museos',
        name: 'Ana Pérez',
        email: 'ana@correo.com',
        createdAt: now,
        confirmationSent: true,
      });
      expect(registrations.registrations).toHaveLength(1);
      expect(mailer.sent).toHaveLength(1);
      expect(mailer.sent[0].to).toBe('ana@correo.com');
      expect(mailer.sent[0].subject).toBe(
        'Inscripción confirmada: Noche de museos',
      );
      // 23:00 UTC del 20 de noviembre son las 6:00 p. m. en Barranquilla.
      expect(mailer.sent[0].text).toMatch(/20 de noviembre de 2026/);
      expect(mailer.sent[0].text).toMatch(/6:00/);
      expect(mailer.sent[0].text).toContain('Museo de la Aduana');
    });

    it('no guarda la inscripción sin el aviso de privacidad aceptado', async () => {
      await expect(
        register.execute(input({ acceptsPrivacyNotice: false })),
      ).rejects.toThrow(BusinessRuleError);

      expect(registrations.registrations).toHaveLength(0);
      expect(mailer.sent).toHaveLength(0);
    });

    it('avisa cuando el evento ya no tiene cupos y no inscribe', async () => {
      await register.execute(input({ email: 'uno@correo.com' }));
      await register.execute(input({ email: 'dos@correo.com' }));

      await expect(
        register.execute(input({ email: 'tres@correo.com' })),
      ).rejects.toThrow(
        expect.objectContaining({
          constructor: ConflictError,
          code: EVENT_FULL,
        }),
      );
      expect(registrations.registrations).toHaveLength(2);
    });

    it('no deja inscribir dos veces el mismo correo en un evento', async () => {
      await register.execute(input());

      await expect(
        register.execute(input({ email: ' ANA@correo.com ' })),
      ).rejects.toThrow(expect.objectContaining({ code: 'YA_INSCRITO' }));
    });

    it('responde que no existe si el evento no existe o no está publicado', async () => {
      await expect(
        register.execute(input({ eventId: 'no-existe' })),
      ).rejects.toThrow(ResourceNotFoundError);

      const late = new RegisterForEventUseCase(events, registrations, mailer, {
        now: () => new Date('2026-11-21T00:00:00Z'),
      });
      await expect(late.execute(input())).rejects.toThrow(
        ResourceNotFoundError,
      );
    });

    it('si el correo falla, la inscripción queda guardada y lo informa', async () => {
      mailer.failing = true;

      const result = await register.execute(input());

      expect(result.confirmationSent).toBe(false);
      expect(registrations.registrations).toHaveLength(1);
    });
  });

  describe('ListEventRegistrationsUseCase', () => {
    let list: ListEventRegistrationsUseCase;

    beforeEach(async () => {
      list = new ListEventRegistrationsUseCase(events, registrations);
      await events.save(event({ capacity: 10 }));
      for (const [name, email] of [
        ['Ana Pérez', 'ana@correo.com'],
        ['Bea Gómez', 'bea@correo.com'],
        ['Carlos Ruiz', 'carlos@correo.com'],
      ]) {
        await register.execute(input({ name, email }));
      }
    });

    it('devuelve los inscritos paginados, en orden de inscripción', async () => {
      const page = await list.execute('e-1', { page: 1, pageSize: 2 });

      expect(page.total).toBe(3);
      expect(page.page).toBe(1);
      expect(page.pageSize).toBe(2);
      expect(page.items.map((r) => r.name)).toEqual(['Ana Pérez', 'Bea Gómez']);
      expect(page.items[0]).toEqual({
        id: 'r-1',
        name: 'Ana Pérez',
        email: 'ana@correo.com',
        createdAt: now,
      });
    });

    it('filtra por nombre o correo', async () => {
      const page = await list.execute('e-1', {
        page: 1,
        pageSize: 10,
        search: 'carlos',
      });

      expect(page.items.map((r) => r.email)).toEqual(['carlos@correo.com']);
      expect(page.total).toBe(1);
    });

    it('responde que no existe si el evento no existe', async () => {
      await expect(
        list.execute('no-existe', { page: 1, pageSize: 10 }),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
