import { ApiProperty } from '@nestjs/swagger';
import type { HealthStatus } from '../../../application/health/check-health.use-case.js';

export class HealthStatusResponse implements HealthStatus {
  @ApiProperty({ enum: ['ok', 'degradado'], example: 'ok' })
  estado: 'ok' | 'degradado';

  @ApiProperty({
    enum: ['disponible', 'no disponible'],
    example: 'disponible',
  })
  baseDatos: 'disponible' | 'no disponible';

  @ApiProperty({ example: '2026-11-04T12:00:00.000Z' })
  fecha: string;
}
