import {
  SectionItem,
  type SectionKind,
} from '../../domain/sections/section-item.js';
import { SectionItemOrmEntity } from './section-item.orm-entity.js';

/** Convierte entre la entidad de dominio y la fila de la base de datos. */
export const SectionItemMapper = {
  toDomain(row: SectionItemOrmEntity): SectionItem {
    return SectionItem.restore({
      id: row.id,
      kind: row.kind as SectionKind,
      title: row.title,
      description: row.description,
      order: row.sortOrder,
      published: row.published,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(item: SectionItem): SectionItemOrmEntity {
    const row = new SectionItemOrmEntity();
    row.id = item.id;
    row.kind = item.kind;
    row.title = item.title;
    row.description = item.description;
    row.sortOrder = item.order;
    row.published = item.published;
    row.createdAt = item.createdAt;
    row.updatedAt = item.updatedAt;
    return row;
  },
};
