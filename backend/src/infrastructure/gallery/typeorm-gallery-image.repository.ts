import { ILike, type Repository } from 'typeorm';
import type {
  GalleryImageRepository,
  GalleryPageResult,
  GalleryQuery,
} from '../../application/gallery/ports/gallery-image-repository.js';
import type { GalleryImage } from '../../domain/gallery/gallery-image.js';
import { GalleryImageMapper } from './gallery-image.mapper.js';
import type { GalleryImageOrmEntity } from './gallery-image.orm-entity.js';

/**
 * En LIKE, "%" y "_" son comodines y "\" es el escape. Se escapan para que
 * lo que escribe la persona se busque como texto literal.
 */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export class TypeOrmGalleryImageRepository implements GalleryImageRepository {
  constructor(private readonly repository: Repository<GalleryImageOrmEntity>) {}

  async findById(id: string): Promise<GalleryImage | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? GalleryImageMapper.toDomain(row) : null;
  }

  async findPage(query: GalleryQuery): Promise<GalleryPageResult> {
    const direction = query.order === 'oldest' ? 'ASC' : 'DESC';
    const [rows, total] = await this.repository.findAndCount({
      where: query.search
        ? { title: ILike(`%${escapeLike(query.search)}%`) }
        : {},
      // El id desempata imágenes con la misma fecha, para que ninguna se
      // repita ni se salte entre una página y otra.
      order: { createdAt: direction, id: direction },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      items: rows.map((row) => GalleryImageMapper.toDomain(row)),
      total,
    };
  }

  async save(image: GalleryImage): Promise<void> {
    await this.repository.save(GalleryImageMapper.toPersistence(image));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
