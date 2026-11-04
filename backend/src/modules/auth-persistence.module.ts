import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { SESSION_REPOSITORY } from '../application/auth/ports/session-repository.js';
import { USER_REPOSITORY } from '../application/users/ports/user-repository.js';
import { RefreshSessionOrmEntity } from '../infrastructure/sessions/refresh-session.orm-entity.js';
import { TypeOrmSessionRepository } from '../infrastructure/sessions/typeorm-session.repository.js';
import { TypeOrmUserRepository } from '../infrastructure/users/typeorm-user.repository.js';
import { UserOrmEntity } from '../infrastructure/users/user.orm-entity.js';

/**
 * Repositorios de usuarios y sesiones con TypeORM. Está separado de
 * AuthModule para que las pruebas e2e lo cambien por repositorios en memoria.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, RefreshSessionOrmEntity])],
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [getRepositoryToken(UserOrmEntity)],
      useFactory: (repository: Repository<UserOrmEntity>) =>
        new TypeOrmUserRepository(repository),
    },
    {
      provide: SESSION_REPOSITORY,
      inject: [getRepositoryToken(RefreshSessionOrmEntity)],
      useFactory: (repository: Repository<RefreshSessionOrmEntity>) =>
        new TypeOrmSessionRepository(repository),
    },
  ],
  exports: [USER_REPOSITORY, SESSION_REPOSITORY],
})
export class AuthPersistenceModule {}
