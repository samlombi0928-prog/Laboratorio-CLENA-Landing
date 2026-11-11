import type {
  SectionItemPageResult,
  SectionItemQuery,
  SectionItemRepository,
} from '../../src/application/sections/ports/section-item-repository.js';
import {
  SECTION_KINDS,
  type SectionItem,
} from '../../src/domain/sections/section-item.js';

/** Repositorio en memoria que imita el filtro, el orden y la paginación del real. */
export class InMemorySectionItemRepository implements SectionItemRepository {
  readonly items = new Map<string, SectionItem>();

  findById(id: string): Promise<SectionItem | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  findPage(query: SectionItemQuery): Promise<SectionItemPageResult> {
    const matching = [...this.items.values()]
      .filter((item) => !query.kind || item.kind === query.kind)
      .filter((item) => !query.onlyPublished || item.published)
      // Igual que la consulta real: por sección, orden, fecha y, si empatan, id.
      .sort(
        (a, b) =>
          SECTION_KINDS.indexOf(a.kind) - SECTION_KINDS.indexOf(b.kind) ||
          a.order - b.order ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id.localeCompare(b.id),
      );
    const start = (query.page - 1) * query.pageSize;
    return Promise.resolve({
      items: matching.slice(start, start + query.pageSize),
      total: matching.length,
    });
  }

  save(item: SectionItem): Promise<void> {
    this.items.set(item.id, item);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.items.delete(id);
    return Promise.resolve();
  }
}
