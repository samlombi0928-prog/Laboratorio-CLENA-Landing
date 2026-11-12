import { QueryFailedError, type Repository } from 'typeorm';
import type {
  UserPageResult,
  UserQuery,
  UserRepository,
} from '../../application/users/ports/user-repository.js';
import { ConflictError } from '../../domain/errors/domain-errors.js';
import type { Role } from '../../domain/users/role.js';
import type { User } from '../../domain/users/user.js';
import { UserMapper } from './user.mapper.js';
import type { UserOrmEntity } from './user.orm-entity.js';

const UNIQUE_VIOLATION = '23505';

export class TypeOrmUserRepository implements UserRepository {
  constructor(private readonly repository: Repository<UserOrmEntity>) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repository.findOneBy({ email });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findPage(query: UserQuery): Promise<UserPageResult> {
    const builder = this.repository.createQueryBuilder('user');
    if (query.role) {
      builder.andWhere('user.role = :role', { role: query.role });
    }
    if (query.search) {
      builder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${escapeLike(query.search)}%` },
      );
    }
    const [rows, total] = await builder
      .orderBy('user.name', 'ASC')
      // El id desempata, para que nada se repita ni se salte entre páginas.
      .addOrderBy('user.id', 'ASC')
      .offset((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .getManyAndCount();
    return { items: rows.map((row) => UserMapper.toDomain(row)), total };
  }

  countByRole(role: Role): Promise<number> {
    return this.repository.countBy({ role });
  }

  async save(user: User): Promise<void> {
    try {
      await this.repository.save(UserMapper.toPersistence(user));
    } catch (error) {
      // Dos registros simultáneos con el mismo correo: gana el primero.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new ConflictError(
          'Ya existe una cuenta con ese correo',
          'CORREO_YA_REGISTRADO',
        );
      }
      throw error;
    }
  }
}

/** Escapa los comodines de LIKE para que "%" o "_" se busquen como texto. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
