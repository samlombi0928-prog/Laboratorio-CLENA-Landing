import { describe, expect, it } from 'vitest';
import { BusinessRuleError } from '../errors/domain-errors.js';
import {
  SECTION_DESCRIPTION_MAX_LENGTH,
  SECTION_TITLE_MAX_LENGTH,
  SectionItem,
  SectionKind,
} from './section-item.js';

const now = new Date('2026-11-07T10:00:00Z');
const base = {
  id: 'id-1',
  kind: SectionKind.Service,
  title: '  Préstamo de libros  ',
  description: '  Préstamo para leer en sala.  ',
  order: 1,
  published: true,
  now,
};

describe('SectionItem', () => {
  it('se crea con el texto limpio y las fechas del momento', () => {
    const item = SectionItem.create(base);

    expect(item.title).toBe('Préstamo de libros');
    expect(item.description).toBe('Préstamo para leer en sala.');
    expect(item.kind).toBe(SectionKind.Service);
    expect(item.published).toBe(true);
    expect(item.createdAt).toEqual(now);
    expect(item.updatedAt).toEqual(now);
  });

  it.each([
    ['título vacío', { title: '   ' }, 'TITULO_REQUERIDO'],
    [
      'título largo',
      { title: 'a'.repeat(SECTION_TITLE_MAX_LENGTH + 1) },
      'TITULO_DEMASIADO_LARGO',
    ],
    ['descripción vacía', { description: '' }, 'DESCRIPCION_REQUERIDA'],
    [
      'descripción larga',
      { description: 'a'.repeat(SECTION_DESCRIPTION_MAX_LENGTH + 1) },
      'DESCRIPCION_DEMASIADO_LARGA',
    ],
    ['orden negativo', { order: -1 }, 'ORDEN_INVALIDO'],
    ['orden decimal', { order: 1.5 }, 'ORDEN_INVALIDO'],
  ])('rechaza %s', (_caso, cambio, codigo) => {
    expect(() => SectionItem.create({ ...base, ...cambio })).toThrowError(
      expect.objectContaining({ code: codigo }) as Error,
    );
  });

  it('actualiza solo los campos que llegan y la fecha de modificación', () => {
    const item = SectionItem.create(base);
    const later = new Date('2026-11-08T10:00:00Z');

    item.update({ published: false, order: 3 }, later);

    expect(item.published).toBe(false);
    expect(item.order).toBe(3);
    expect(item.title).toBe('Préstamo de libros');
    expect(item.updatedAt).toEqual(later);
    expect(item.createdAt).toEqual(now);
  });

  it('no deja actualizar con datos inválidos', () => {
    const item = SectionItem.create(base);

    expect(() => item.update({ title: '' }, now)).toThrow(BusinessRuleError);
    expect(item.title).toBe('Préstamo de libros');
  });
});
