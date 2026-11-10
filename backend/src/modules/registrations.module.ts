import { Module } from '@nestjs/common';
import {
  EVENT_REPOSITORY,
  type EventRepository,
} from '../application/events/ports/event-repository.js';
import {
  MAILER,
  type Mailer,
} from '../application/notifications/ports/mailer.js';
import { ListEventRegistrationsUseCase } from '../application/registrations/list-event-registrations.use-case.js';
import {
  REGISTRATION_REPOSITORY,
  type RegistrationRepository,
} from '../application/registrations/ports/registration-repository.js';
import { RegisterForEventUseCase } from '../application/registrations/register-for-event.use-case.js';
import { RegistrationsController } from '../presentation/http/registrations/registrations.controller.js';
import { EventsPersistenceModule } from './events-persistence.module.js';
import { NotificationsModule } from './notifications.module.js';
import { RegistrationsPersistenceModule } from './registrations-persistence.module.js';

/** Inscripciones a eventos (#46). */
@Module({
  imports: [
    EventsPersistenceModule,
    RegistrationsPersistenceModule,
    NotificationsModule,
  ],
  controllers: [RegistrationsController],
  providers: [
    {
      provide: RegisterForEventUseCase,
      inject: [EVENT_REPOSITORY, REGISTRATION_REPOSITORY, MAILER],
      useFactory: (
        events: EventRepository,
        registrations: RegistrationRepository,
        mailer: Mailer,
      ) => new RegisterForEventUseCase(events, registrations, mailer),
    },
    {
      provide: ListEventRegistrationsUseCase,
      inject: [EVENT_REPOSITORY, REGISTRATION_REPOSITORY],
      useFactory: (
        events: EventRepository,
        registrations: RegistrationRepository,
      ) => new ListEventRegistrationsUseCase(events, registrations),
    },
  ],
})
export class RegistrationsModule {}
