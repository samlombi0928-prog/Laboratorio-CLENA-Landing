import { detectImageType } from './detect-image-type.js';

describe('detectImageType', () => {
  it('reconoce JPG y PNG por sus primeros bytes', () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]))).toBe(
      'image/jpeg',
    );
    expect(
      detectImageType(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]),
      ),
    ).toBe('image/png');
  });

  it('devuelve null para cualquier otro contenido', () => {
    expect(detectImageType(new TextEncoder().encode('<svg></svg>'))).toBeNull();
    expect(detectImageType(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});
