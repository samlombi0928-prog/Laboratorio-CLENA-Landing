import { randomUUID } from 'node:crypto';
import {
  SectionItem,
  type SectionKind,
} from '../../domain/sections/section-item.js';
import type { SectionItemRepository } from './ports/section-item-repository.js';

export interface CreateSectionItemInput {
  kind: SectionKind;
  title: string;
  description: string;
  /** Por defecto 0: queda de primero en su sección. */
  order?: number;
  /** Por defecto queda publicado. */
  published?: boolean;
}

export interface CreateSectionItemOptions {
  now?: () => Date;
  generateId?: () => string;
}

/** El personal agrega un espacio, un servicio o un horario a la landing. */
export class CreateSectionItemUseCase {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly items: SectionItemRepository,
    options: CreateSectionItemOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  async execute(input: CreateSectionItemInput): Promise<SectionItem> {
    const item = SectionItem.create({
      id: this.generateId(),
      kind: input.kind,
      title: input.title,
      description: input.description,
      order: input.order ?? 0,
      published: input.published ?? true,
      now: this.now(),
    });
    await this.items.save(item);
    return item;
  }
}
