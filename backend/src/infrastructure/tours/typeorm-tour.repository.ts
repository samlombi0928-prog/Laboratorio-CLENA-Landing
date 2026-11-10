import type { Repository } from 'typeorm';
import type { PageRequest } from '../../application/common/pagination.js';
import type {
  TourPageResult,
  TourRepository,
} from '../../application/tours/ports/tour-repository.js';
import type { Tour } from '../../domain/tours/tour.js';
import { TourMapper } from './tour.mapper.js';
import type { TourOrmEntity } from './tour.orm-entity.js';

export class TypeOrmTourRepository implements TourRepository {
  constructor(private readonly repository: Repository<TourOrmEntity>) {}

  async findById(id: string): Promise<Tour | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? TourMapper.toDomain(row) : null;
  }

  async findByOwner(
    ownerId: string,
    page: PageRequest,
  ): Promise<TourPageResult> {
    const [rows, total] = await this.repository.findAndCount({
      where: { ownerId },
      // El id desempata, para que nada se repita ni se salte entre páginas.
      order: { createdAt: 'DESC', id: 'ASC' },
      skip: (page.page - 1) * page.pageSize,
      take: page.pageSize,
    });
    return { items: rows.map((row) => TourMapper.toDomain(row)), total };
  }

  async save(tour: Tour): Promise<void> {
    await this.repository.save(TourMapper.toPersistence(tour));
  }
}
