import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface FieldError {
  campo: string;
  errores: string[];
}

/** Aplana los errores de class-validator, incluidos los de objetos anidados. */
export function flattenValidationErrors(
  errors: ValidationError[],
  prefix = '',
): FieldError[] {
  return errors.flatMap((error) => {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    const own = error.constraints
      ? [{ campo: field, errores: Object.values(error.constraints) }]
      : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

/**
 * Valida todos los DTOs de entrada: descarta la petición si trae campos que no
 * están en el DTO y responde con el detalle de cada campo inválido.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        codigo: 'VALIDACION',
        mensaje: 'Los datos enviados no son válidos',
        detalles: flattenValidationErrors(errors),
      }),
  });
}
