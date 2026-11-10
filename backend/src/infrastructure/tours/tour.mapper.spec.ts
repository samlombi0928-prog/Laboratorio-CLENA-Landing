import { Tour } from '../../domain/tours/tour.js';
import { TourStatus } from '../../domain/tours/tour-status.js';
import { TourMapper } from './tour.mapper.js';

describe('TourMapper', () => {
  it('conserva todos los datos al ir y volver de la base', () => {
    const now = new Date('2026-11-05T12:00:00.000Z');
    const tour = Tour.restore({
      id: 't-1',
      ownerId: 'u-1',
      title: 'Recorrido',
      description: 'Descripción',
      coverKey: 'covers/a.png',
      status: TourStatus.Published,
      createdAt: now,
      updatedAt: new Date(now.getTime() + 1000),
    });

    const back = TourMapper.toDomain(TourMapper.toPersistence(tour));

    expect(back).toEqual(tour);
  });
});
