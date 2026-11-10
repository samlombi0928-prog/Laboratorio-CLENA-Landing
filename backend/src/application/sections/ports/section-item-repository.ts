import type {
  SectionItem,
  SectionKind,
} from '../../../domain/sections/section-item.js';
import type { PageRequest } from '../../common/pagination.js';

export interface SectionItemQuery extends PageRequest {
  /** Solo los de esta sección. Sin valor, todas. */
  kind?: SectionKind;
  /** true para la landing pública: solo los publicados. */
  onlyPublished: boolean;
}

export interface SectionItemPageResult {
  /** Solo los elementos de la página pedida, por sección y luego por orden. */
  items: SectionItem[];
  /** Total de elementos que cumplen el filtro, en todas las páginas. */
  total: number;
}

export interface SectionItemRepository {
  findById(id: string): Promise<SectionItem | null>;
  findPage(query: SectionItemQuery): Promise<SectionItemPageResult>;
  save(item: SectionItem): Promise<void>;
  delete(id: string): Promise<void>;
}

export const SECTION_ITEM_REPOSITORY = Symbol('SectionItemRepository');
