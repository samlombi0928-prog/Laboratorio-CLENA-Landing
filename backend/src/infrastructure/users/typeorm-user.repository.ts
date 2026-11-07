import { QueryFailedError, type Repository } from 'typeorm';
import type { UserRepository } from '../../application/users/ports/user-repository.js';
import { ConflictError } from '../../domain/errors/domain-errors.js';
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
