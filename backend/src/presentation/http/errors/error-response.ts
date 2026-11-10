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
    example: [{ campo: 'titulo', errores: ['titulo should not be empty'] }],
  })
  detalles?: unknown;

  @ApiProperty({ example: '/api/v1/recorridos' })
  ruta: string;

  @ApiProperty({ example: '2026-11-04T12:00:00.000Z' })
  fecha: string;
}
