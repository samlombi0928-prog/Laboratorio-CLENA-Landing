import type { Role } from '../../../domain/users/role.js';
import type { User } from '../../../domain/users/user.js';
import type { PageRequest } from '../../common/pagination.js';

export interface UserQuery extends PageRequest {
  /** Filtra por nombre o correo, sin distinguir mayúsculas. */
  search?: string;
  role?: Role;
}

export interface UserPageResult {
  /** Solo los usuarios de la página pedida, por nombre. */
  items: User[];
  /** Total de usuarios que cumplen el filtro, en todas las páginas. */
  total: number;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** Busca por el correo ya normalizado (ver normalizeEmail). */
  findByEmail(email: string): Promise<User | null>;
  findPage(query: UserQuery): Promise<UserPageResult>;
  /** Cuántas cuentas tienen ese rol. */
  countByRole(role: Role): Promise<number>;
  /** Guarda el usuario. Lanza ConflictError si el correo ya está registrado. */
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
