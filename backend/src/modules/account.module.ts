import { Module } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../application/auth/ports/password-hasher.js';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../application/storage/ports/file-storage.js';
import { DeleteAccountUseCase } from '../application/users/delete-account.use-case.js';
import {
  ACCOUNT_ERASER,
  type AccountEraser,
} from '../application/users/ports/account-eraser.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../application/users/ports/user-repository.js';
import { AccountController } from '../presentation/http/account/account.controller.js';
import { AccountPersistenceModule } from './account-persistence.module.js';
import { AuthPersistenceModule } from './auth-persistence.module.js';
import { AuthModule } from './auth.module.js';
import { StorageModule } from './storage.module.js';

/** Raíz de composición de la eliminación de la cuenta propia (HU-10). */
@Module({
  imports: [
    AuthModule,
    AuthPersistenceModule,
    AccountPersistenceModule,
    StorageModule,
  ],
  controllers: [AccountController],
  providers: [
    {
      provide: DeleteAccountUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER, ACCOUNT_ERASER, FILE_STORAGE],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        eraser: AccountEraser,
        storage: FileStorage,
      ) => new DeleteAccountUseCase(users, hasher, eraser, storage),
    },
  ],
})
export class AccountModule {}
