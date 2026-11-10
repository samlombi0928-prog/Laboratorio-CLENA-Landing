import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type {
  SectionItem,
  SectionItemChanges,
} from '../../domain/sections/section-item.js';
import type { SectionItemRepository } from './ports/section-item-repository.js';

/** El personal cambia el texto, el orden o si un elemento está publicado. */
export class UpdateSectionItemUseCase {
  private readonly now: () => Date;

  constructor(
    private readonly items: SectionItemRepository,
    options: { now?: () => Date } = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async execute(id: string, changes: SectionItemChanges): Promise<SectionItem> {
    const item = await this.items.findById(id);
    if (!item) {
      throw new ResourceNotFoundError('Elemento de sección', id);
    }
    item.update(changes, this.now());
    await this.items.save(item);
    return item;
  }
}
