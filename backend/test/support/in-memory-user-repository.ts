import type {
  UserPageResult,
  UserQuery,
  UserRepository,
} from '../../src/application/users/ports/user-repository.js';
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

  findPage(query: UserQuery): Promise<UserPageResult> {
    const search = query.search?.toLowerCase();
    const matching = [...this.users.values()]
      .filter((u) => !query.role || u.role === query.role)
      .filter(
        (u) =>
          !search ||
          u.name.toLowerCase().includes(search) ||
          u.email.includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const start = (query.page - 1) * query.pageSize;
    return Promise.resolve({
      items: matching.slice(start, start + query.pageSize),
      total: matching.length,
    });
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
