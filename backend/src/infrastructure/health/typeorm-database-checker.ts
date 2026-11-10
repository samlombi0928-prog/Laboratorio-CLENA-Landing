import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { DatabaseChecker } from '../../application/health/ports/database-checker.js';

@Injectable()
export class TypeOrmDatabaseChecker implements DatabaseChecker {
  constructor(private readonly dataSource: DataSource) {}

  async isAvailable(): Promise<boolean> {
    if (!this.dataSource.isInitialized) {
      return false;
    }
    await this.dataSource.query('SELECT 1');
    return true;
  }
}
