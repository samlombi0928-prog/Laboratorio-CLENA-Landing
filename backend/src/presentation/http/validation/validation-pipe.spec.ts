import type { ValidationError } from 'class-validator';
import { flattenValidationErrors } from './validation-pipe.js';

describe('flattenValidationErrors', () => {
  it('lista cada campo inválido con sus mensajes, incluidos los anidados', () => {
    const errors = [
      {
        property: 'titulo',
        constraints: { isNotEmpty: 'titulo should not be empty' },
        children: [],
      },
      {
        property: 'portada',
        children: [
          {
            property: 'url',
            constraints: { isUrl: 'url must be a URL address' },
            children: [],
          },
        ],
      },
    ] as ValidationError[];

    expect(flattenValidationErrors(errors)).toEqual([
      { campo: 'titulo', errores: ['titulo should not be empty'] },
      { campo: 'portada.url', errores: ['url must be a URL address'] },
    ]);
  });
});
