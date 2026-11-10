import { Module } from '@nestjs/common';
import { ChangeUserRoleUseCase } from '../application/users/change-user-role.use-case.js';
import { ListUsersUseCase } from '../application/users/list-users.use-case.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../application/users/ports/user-repository.js';
import { UsersController } from '../presentation/http/users/users.controller.js';
import { AuthPersistenceModule } from './auth-persistence.module.js';

/** Gestión de roles de usuario (#24). */
@Module({
  imports: [AuthPersistenceModule],
  controllers: [UsersController],
  providers: [
    {
      provide: ListUsersUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new ListUsersUseCase(users),
    },
    {
      provide: ChangeUserRoleUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new ChangeUserRoleUseCase(users),
    },
  ],
})
export class UsersModule {}
