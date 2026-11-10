import type {
  SectionItem,
  SectionKind,
} from '../../domain/sections/section-item.js';
import {
  buildPage,
  normalizePageRequest,
  type Page,
  type PageRequest,
} from '../common/pagination.js';
import type { SectionItemRepository } from './ports/section-item-repository.js';

export interface ListSectionItemsInput extends Partial<PageRequest> {
  kind?: SectionKind;
  /** true en la landing pública; false en el panel del personal. */
  onlyPublished: boolean;
}

/** Lista los elementos de las secciones, con paginación y filtro por sección. */
export class ListSectionItemsUseCase {
  constructor(private readonly items: SectionItemRepository) {}

  async execute(input: ListSectionItemsInput): Promise<Page<SectionItem>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.items.findPage({
      ...request,
      kind: input.kind,
      onlyPublished: input.onlyPublished,
    });
    return buildPage(items, request, total);
  }
}
