import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Formato único de todas las respuestas de error de la API. */
export class ErrorResponse {
  @ApiProperty({ example: 400 })
  estado: number;

  @ApiProperty({ example: 'VALIDACION' })
  codigo: string;

  @ApiProperty({ example: 'Los datos enviados no son válidos' })
  mensaje: string;

  @ApiPropertyOptional({
    description:
      'Solo en errores de validación: un elemento por campo inválido',
    example: [{ campo: 'correo', errores: ['correo must be an email'] }],
  })
  detalles?: unknown;

  @ApiProperty({
    description: 'Ruta de la petición que falló',
    example: '/api/v1/...',
  })
  ruta: string;

  @ApiProperty({ example: '2026-11-04T12:00:00.000Z' })
  fecha: string;
}
