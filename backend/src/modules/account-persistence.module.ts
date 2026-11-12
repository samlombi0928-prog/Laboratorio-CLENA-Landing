import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ACCOUNT_ERASER } from '../application/users/ports/account-eraser.js';
import { RegistrationOrmEntity } from '../infrastructure/registrations/registration.orm-entity.js';
import { TourOrmEntity } from '../infrastructure/tours/tour.orm-entity.js';
import { TypeOrmAccountEraser } from '../infrastructure/users/typeorm-account-eraser.js';
import { UserOrmEntity } from '../infrastructure/users/user.orm-entity.js';

/**
 * Borrado de cuentas con TypeORM. Toca varias tablas (cuentas, recorridos e
 * inscripciones) en una sola transacción. Está separado de AccountModule para
 * que las pruebas e2e lo cambien por uno en memoria.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      TourOrmEntity,
      RegistrationOrmEntity,
    ]),
  ],
  providers: [
    {
      provide: ACCOUNT_ERASER,
      inject: [getRepositoryToken(UserOrmEntity)],
      useFactory: (repository: Repository<UserOrmEntity>) =>
        new TypeOrmAccountEraser(repository),
    },
  ],
  exports: [ACCOUNT_ERASER],
})
export class AccountPersistenceModule {}
