import type { Repository } from 'typeorm';
import type { TourRepository } from '../../application/tours/ports/tour-repository.js';
import type { Tour } from '../../domain/tours/tour.js';
import { TourMapper } from './tour.mapper.js';
import type { TourOrmEntity } from './tour.orm-entity.js';

export class TypeOrmTourRepository implements TourRepository {
  constructor(private readonly repository: Repository<TourOrmEntity>) {}

  async findById(id: string): Promise<Tour | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? TourMapper.toDomain(row) : null;
  }

  async findByOwner(ownerId: string): Promise<Tour[]> {
    const rows = await this.repository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => TourMapper.toDomain(row));
  }

  async save(tour: Tour): Promise<void> {
    await this.repository.save(TourMapper.toPersistence(tour));
  }
}
