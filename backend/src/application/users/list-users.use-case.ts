import type { Role } from '../../domain/users/role.js';
import { toUserView, type UserView } from '../auth/auth-result.js';
import {
  buildPage,
  normalizePageRequest,
  type Page,
  type PageRequest,
} from '../common/pagination.js';
import type { UserRepository } from './ports/user-repository.js';

export interface ListUsersInput extends Partial<PageRequest> {
  search?: string;
  role?: Role;
}

/** Lista de usuarios para que el administrador asigne roles. */
export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: ListUsersInput): Promise<Page<UserView>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.users.findPage({
      ...request,
      search: input.search,
      role: input.role,
    });
    return buildPage(items.map(toUserView), request, total);
  }
}
