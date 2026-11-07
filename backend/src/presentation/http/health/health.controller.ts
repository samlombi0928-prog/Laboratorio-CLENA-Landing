import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CheckHealthUseCase } from '../../../application/health/check-health.use-case.js';
import { HealthStatusResponse } from './health-status.response.js';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la API y de la base de datos' })
  @ApiOkResponse({ type: HealthStatusResponse })
  @ApiServiceUnavailableResponse({
    type: HealthStatusResponse,
    description: 'La base de datos no responde',
  })
  async check(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthStatusResponse> {
    const health = await this.checkHealth.execute();
    if (health.estado !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}
