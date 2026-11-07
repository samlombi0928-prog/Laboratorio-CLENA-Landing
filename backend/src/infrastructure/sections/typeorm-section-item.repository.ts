import type { Repository } from 'typeorm';
import type {
  SectionItemPageResult,
  SectionItemQuery,
  SectionItemRepository,
} from '../../application/sections/ports/section-item-repository.js';
import type { SectionItem } from '../../domain/sections/section-item.js';
import { SectionItemMapper } from './section-item.mapper.js';
import type { SectionItemOrmEntity } from './section-item.orm-entity.js';

/** Las secciones salen en el orden de la landing: espacios, servicios y horarios. */
const KIND_ORDER = `CASE item.kind WHEN 'space' THEN 0 WHEN 'service' THEN 1 ELSE 2 END`;

export class TypeOrmSectionItemRepository implements SectionItemRepository {
  constructor(private readonly repository: Repository<SectionItemOrmEntity>) {}

  async findById(id: string): Promise<SectionItem | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? SectionItemMapper.toDomain(row) : null;
  }

  async findPage(query: SectionItemQuery): Promise<SectionItemPageResult> {
    const builder = this.repository.createQueryBuilder('item');
    if (query.onlyPublished) {
      builder.andWhere('item.published = true');
    }
    if (query.kind) {
      builder.andWhere('item.kind = :kind', { kind: query.kind });
    }
    const [rows, total] = await builder
      .orderBy(KIND_ORDER, 'ASC')
      .addOrderBy('item.sortOrder', 'ASC')
      // La fecha y el id desempatan, para que nada se repita ni se salte
      // entre una página y otra.
      .addOrderBy('item.createdAt', 'ASC')
      .addOrderBy('item.id', 'ASC')
      .offset((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .getManyAndCount();
    return {
      items: rows.map((row) => SectionItemMapper.toDomain(row)),
      total,
    };
  }

  async save(item: SectionItem): Promise<void> {
    await this.repository.save(SectionItemMapper.toPersistence(item));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
