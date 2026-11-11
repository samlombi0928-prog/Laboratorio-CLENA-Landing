import { randomUUID } from 'node:crypto';
import { AgendaEvent } from '../../domain/events/agenda-event.js';
import { type EventView, toEventView } from './event-view.js';
import type { EventRepository } from './ports/event-repository.js';

export interface CreateEventInput {
  title: string;
  description?: string;
  location: string;
  startsAt: Date;
  capacity: number;
  publishFrom: Date;
  publishUntil: Date;
}

export interface CreateEventOptions {
  now?: () => Date;
  generateId?: () => string;
}

/** El personal programa un evento en la agenda con su periodo de publicación. */
export class CreateEventUseCase {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly events: EventRepository,
    options: CreateEventOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  async execute(input: CreateEventInput): Promise<EventView> {
    const now = this.now();
    const event = AgendaEvent.create({
      ...input,
      id: this.generateId(),
      now,
    });
    await this.events.save(event);
    return toEventView(event, now);
  }
}
