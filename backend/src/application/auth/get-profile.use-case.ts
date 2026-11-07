import { ResourceNotFoundError } from '../../domain/errors/domain-errors.js';
import type { UserRepository } from '../users/ports/user-repository.js';
import { toUserView, type UserView } from './auth-result.js';

export class GetProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<UserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('Usuario', userId);
    }
    return toUserView(user);
  }
}
