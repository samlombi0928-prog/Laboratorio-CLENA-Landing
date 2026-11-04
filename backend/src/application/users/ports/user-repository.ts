import type { User } from '../../../domain/users/user.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** Busca por el correo ya normalizado (ver normalizeEmail). */
  findByEmail(email: string): Promise<User | null>;
  /** Guarda el usuario. Lanza ConflictError si el correo ya está registrado. */
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
