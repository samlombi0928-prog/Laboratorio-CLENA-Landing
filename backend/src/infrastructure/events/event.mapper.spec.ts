import { AgendaEvent } from '../../domain/events/agenda-event.js';
import { EventMapper } from './event.mapper.js';

describe('EventMapper', () => {
  it('convierte el evento a fila y de vuelta sin perder datos', () => {
    const event = AgendaEvent.create({
      id: '7d0c2f4e-1b9a-4f3e-8c2d-5a6b7c8d9e0f',
      title: 'Noche de museos',
      description: 'Recorrido nocturno',
      location: 'Museo de la Aduana',
      startsAt: new Date('2026-11-20T23:00:00Z'),
      capacity: 30,
      publishFrom: new Date('2026-11-07T00:00:00Z'),
      publishUntil: new Date('2026-11-20T23:00:00Z'),
      now: new Date('2026-11-07T12:00:00Z'),
    });

    const row = EventMapper.toPersistence(event);
    const restored = EventMapper.toDomain(row);

    expect(row.publishUntil).toEqual(event.publishUntil);
    expect(restored).toEqual(event);
  });
});
