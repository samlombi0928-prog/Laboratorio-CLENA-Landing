import { Module } from '@nestjs/common';
import { CreateEventUseCase } from '../application/events/create-event.use-case.js';
import { DeleteEventUseCase } from '../application/events/delete-event.use-case.js';
import { ListEventsUseCase } from '../application/events/list-events.use-case.js';
import {
  EVENT_REPOSITORY,
  type EventRepository,
} from '../application/events/ports/event-repository.js';
import { UpdateEventUseCase } from '../application/events/update-event.use-case.js';
import { EventsController } from '../presentation/http/events/events.controller.js';
import { EventsPersistenceModule } from './events-persistence.module.js';

/** Agenda de eventos con publicación por fechas (#44 y #45). */
@Module({
  imports: [EventsPersistenceModule],
  controllers: [EventsController],
  providers: [
    {
      provide: ListEventsUseCase,
      inject: [EVENT_REPOSITORY],
      useFactory: (events: EventRepository) => new ListEventsUseCase(events),
    },
    {
      provide: CreateEventUseCase,
      inject: [EVENT_REPOSITORY],
      useFactory: (events: EventRepository) => new CreateEventUseCase(events),
    },
    {
      provide: UpdateEventUseCase,
      inject: [EVENT_REPOSITORY],
      useFactory: (events: EventRepository) => new UpdateEventUseCase(events),
    },
    {
      provide: DeleteEventUseCase,
      inject: [EVENT_REPOSITORY],
      useFactory: (events: EventRepository) => new DeleteEventUseCase(events),
    },
  ],
})
export class EventsModule {}
