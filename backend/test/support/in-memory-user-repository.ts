import type { UserRepository } from '../../src/application/users/ports/user-repository.js';
import { ConflictError } from '../../src/domain/errors/domain-errors.js';
import type { User } from '../../src/domain/users/user.js';

export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, User>();

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    const user = [...this.users.values()].find((u) => u.email === email);
    return Promise.resolve(user ?? null);
  }

  save(user: User): Promise<void> {
    const duplicated = [...this.users.values()].some(
      (u) => u.email === user.email && u.id !== user.id,
    );
    if (duplicated) {
      return Promise.reject(
        new ConflictError(
          'Ya existe una cuenta con ese correo',
          'CORREO_YA_REGISTRADO',
        ),
      );
    }
    this.users.set(user.id, user);
    return Promise.resolve();
  }
}
