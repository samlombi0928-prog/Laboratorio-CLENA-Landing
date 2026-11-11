import { BusinessRuleError } from '../errors/domain-errors.js';
import {
  GALLERY_ALT_TEXT_MAX_LENGTH,
  GALLERY_TITLE_MAX_LENGTH,
  GalleryImage,
  validateGalleryText,
} from './gallery-image.js';

const NOW = new Date('2026-11-07T12:00:00.000Z');

function valid(
  overrides: Partial<Parameters<typeof GalleryImage.create>[0]> = {},
) {
  return {
    id: 'g-1',
    title: 'Fachada',
    altText: 'Fachada de la Aduana',
    imageKey: 'gallery/abc.jpg',
    uploadedBy: 'u-1',
    now: NOW,
    ...overrides,
  };
}

describe('GalleryImage', () => {
  it('se crea con el título y el texto alternativo sin espacios sobrantes', () => {
    const image = GalleryImage.create(
      valid({ title: '  Fachada  ', altText: '  Vista desde la plaza ' }),
    );

    expect(image.title).toBe('Fachada');
    expect(image.altText).toBe('Vista desde la plaza');
    expect(image.imageKey).toBe('gallery/abc.jpg');
    expect(image.uploadedBy).toBe('u-1');
    expect(image.createdAt).toBe(NOW);
  });

  it.each([
    ['título vacío', { title: '   ' }, 'TITULO_REQUERIDO'],
    [
      'título largo',
      { title: 'a'.repeat(GALLERY_TITLE_MAX_LENGTH + 1) },
      'TITULO_DEMASIADO_LARGO',
    ],
    ['texto alternativo vacío', { altText: '' }, 'TEXTO_ALTERNATIVO_REQUERIDO'],
    [
      'texto alternativo largo',
      { altText: 'a'.repeat(GALLERY_ALT_TEXT_MAX_LENGTH + 1) },
      'TEXTO_ALTERNATIVO_DEMASIADO_LARGO',
    ],
  ])('rechaza un %s', (_name, overrides, code) => {
    expect(() => GalleryImage.create(valid(overrides))).toThrow(
      BusinessRuleError,
    );
    expect(() => GalleryImage.create(valid(overrides))).toThrow(
      expect.objectContaining({ code }),
    );
  });

  it('acepta textos justo en el máximo', () => {
    expect(() =>
      GalleryImage.create(
        valid({
          title: 'a'.repeat(GALLERY_TITLE_MAX_LENGTH),
          altText: 'a'.repeat(GALLERY_ALT_TEXT_MAX_LENGTH),
        }),
      ),
    ).not.toThrow();
  });

  it('restore reconstruye una imagen de una cuenta ya eliminada (uploadedBy null)', () => {
    const image = GalleryImage.restore({
      id: 'g-2',
      title: 'Patio',
      altText: 'Patio interior',
      imageKey: 'gallery/def.png',
      uploadedBy: null,
      createdAt: NOW,
    });

    expect(image.uploadedBy).toBeNull();
    expect(image.id).toBe('g-2');
  });
});

describe('validateGalleryText', () => {
  it('devuelve los textos limpios', () => {
    expect(validateGalleryText({ title: ' A ', altText: ' B ' })).toEqual({
      title: 'A',
      altText: 'B',
    });
  });
});
