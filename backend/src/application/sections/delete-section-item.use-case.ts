import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { SectionItemRepository } from './ports/section-item-repository.js';

/** El personal elimina un elemento de una sección. */
export class DeleteSectionItemUseCase {
  constructor(private readonly items: SectionItemRepository) {}

  async execute(id: string): Promise<void> {
    const item = await this.items.findById(id);
    if (!item) {
      throw new ResourceNotFoundError('Elemento de sección', id);
    }
    await this.items.delete(id);
  }
}
