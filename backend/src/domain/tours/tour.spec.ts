import { BusinessRuleError } from '../errors/domain-errors.js';
import {
  Tour,
  TOUR_DESCRIPTION_MAX_LENGTH,
  TOUR_TITLE_MAX_LENGTH,
} from './tour.js';
import { TourStatus } from './tour-status.js';

const now = new Date('2026-11-05T12:00:00.000Z');

const validInput = {
  id: 't-1',
  ownerId: 'u-1',
  title: '  La Aduana de noche  ',
  description: '  Un recorrido por el edificio.  ',
  coverKey: 'covers/portada.jpg',
  now,
};

describe('Tour', () => {
  it('crea un borrador con el título y la descripción sin espacios de sobra', () => {
    const tour = Tour.create(validInput);

    expect(tour.id).toBe('t-1');
    expect(tour.ownerId).toBe('u-1');
    expect(tour.title).toBe('La Aduana de noche');
    expect(tour.description).toBe('Un recorrido por el edificio.');
    expect(tour.coverKey).toBe('covers/portada.jpg');
    expect(tour.status).toBe(TourStatus.Draft);
    expect(tour.createdAt).toBe(now);
    expect(tour.updatedAt).toBe(now);
  });

  it('la descripción y la portada son opcionales', () => {
    const tour = Tour.create({ id: 't-1', ownerId: 'u-1', title: 'Hola', now });

    expect(tour.description).toBe('');
    expect(tour.coverKey).toBeNull();
  });

  it('exige un título', () => {
    expect(() => Tour.create({ ...validInput, title: '   ' })).toThrow(
      expect.objectContaining({ code: 'TITULO_REQUERIDO' }),
    );
  });

  it('limita el largo del título y de la descripción', () => {
    expect(() =>
      Tour.create({
        ...validInput,
        title: 'a'.repeat(TOUR_TITLE_MAX_LENGTH + 1),
      }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      Tour.create({
        ...validInput,
        description: 'a'.repeat(TOUR_DESCRIPTION_MAX_LENGTH + 1),
      }),
    ).toThrow(expect.objectContaining({ code: 'DESCRIPCION_DEMASIADO_LARGA' }));
    expect(
      Tour.create({ ...validInput, title: 'a'.repeat(TOUR_TITLE_MAX_LENGTH) })
        .title,
    ).toHaveLength(TOUR_TITLE_MAX_LENGTH);
  });

  it('un borrador solo lo ve su creador', () => {
    const tour = Tour.create(validInput);

    expect(tour.isOwnedBy('u-1')).toBe(true);
    expect(tour.isVisibleTo('u-1')).toBe(true);
    expect(tour.isVisibleTo('u-2')).toBe(false);
    expect(tour.isVisibleTo(null)).toBe(false);
  });

  it('un recorrido publicado lo ve cualquiera', () => {
    const tour = Tour.restore({
      id: 't-2',
      ownerId: 'u-1',
      title: 'Publicado',
      description: '',
      coverKey: null,
      status: TourStatus.Published,
      createdAt: now,
      updatedAt: now,
    });

    expect(tour.isVisibleTo('u-2')).toBe(true);
    expect(tour.isVisibleTo(null)).toBe(true);
  });
});
