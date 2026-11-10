import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { Role } from '../../domain/users/role.js';
import { toUserView, type UserView } from '../auth/auth-result.js';
import type { UserRepository } from './ports/user-repository.js';

/**
 * El administrador nombra o retira al personal del CLENA. El cambio se aplica
 * en la próxima renovación de la sesión del usuario (máximo 15 minutos).
 */
export class ChangeUserRoleUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string, role: Role): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('Usuario', userId);
    }
    user.changeRole(role);
    await this.users.save(user);
    return toUserView(user);
  }
}
