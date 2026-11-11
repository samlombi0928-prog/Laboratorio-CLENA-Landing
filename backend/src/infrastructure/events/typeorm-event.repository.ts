import type { Repository } from 'typeorm';
import type { EventRepository } from '../../application/events/ports/event-repository.js';
import type { AgendaEvent } from '../../domain/events/agenda-event.js';
import { EventMapper } from './event.mapper.js';
import type { EventOrmEntity } from './event.orm-entity.js';

export class TypeOrmEventRepository implements EventRepository {
  constructor(private readonly repository: Repository<EventOrmEntity>) {}

  async findById(id: string): Promise<AgendaEvent | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? EventMapper.toDomain(row) : null;
  }

  async save(event: AgendaEvent): Promise<void> {
    await this.repository.save(EventMapper.toPersistence(event));
  }
}
