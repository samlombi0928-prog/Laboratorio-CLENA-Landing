import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { REGISTRATION_REPOSITORY } from '../application/registrations/ports/registration-repository.js';
import { RegistrationOrmEntity } from '../infrastructure/registrations/registration.orm-entity.js';
import { TypeOrmRegistrationRepository } from '../infrastructure/registrations/typeorm-registration.repository.js';

/**
 * Repositorio de inscripciones con TypeORM. Está separado de
 * RegistrationsModule para que las pruebas e2e lo cambien por uno en memoria.
 */
@Module({
  imports: [TypeOrmModule.forFeature([RegistrationOrmEntity])],
  providers: [
    {
      provide: REGISTRATION_REPOSITORY,
      inject: [getRepositoryToken(RegistrationOrmEntity)],
      useFactory: (repository: Repository<RegistrationOrmEntity>) =>
        new TypeOrmRegistrationRepository(repository),
    },
  ],
  exports: [REGISTRATION_REPOSITORY],
})
export class RegistrationsPersistenceModule {}
