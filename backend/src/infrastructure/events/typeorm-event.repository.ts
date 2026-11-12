import type { Repository } from 'typeorm';
import type {
  EventPageResult,
  EventQuery,
  EventRepository,
} from '../../application/events/ports/event-repository.js';
import type { AgendaEvent } from '../../domain/events/agenda-event.js';
import { EventStatus } from '../../domain/events/event-status.js';
import { EventMapper } from './event.mapper.js';
import type { EventOrmEntity } from './event.orm-entity.js';

/** Las mismas condiciones de `AgendaEvent.statusAt`, en SQL. */
const STATUS_CONDITION: Record<EventStatus, string> = {
  [EventStatus.Closed]: '(event.startsAt <= :now OR event.publishUntil < :now)',
  [EventStatus.Scheduled]:
    'event.startsAt > :now AND event.publishUntil >= :now AND event.publishFrom > :now',
  [EventStatus.Published]:
    'event.startsAt > :now AND event.publishUntil >= :now AND event.publishFrom <= :now',
};

export class TypeOrmEventRepository implements EventRepository {
  constructor(private readonly repository: Repository<EventOrmEntity>) {}

  async findById(id: string): Promise<AgendaEvent | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? EventMapper.toDomain(row) : null;
  }

  async findPage(query: EventQuery): Promise<EventPageResult> {
    const builder = this.repository.createQueryBuilder('event');
    if (query.status) {
      builder.andWhere(STATUS_CONDITION[query.status], { now: query.now });
    }
    if (query.search) {
      builder.andWhere(
        '(event.title ILIKE :search OR event.location ILIKE :search)',
        { search: `%${escapeLike(query.search)}%` },
      );
    }
    const [rows, total] = await builder
      .orderBy('event.startsAt', 'ASC')
      // El id desempata, para que nada se repita ni se salte entre páginas.
      .addOrderBy('event.id', 'ASC')
      .offset((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .getManyAndCount();
    return {
      items: rows.map((row) => EventMapper.toDomain(row)),
      total,
    };
  }

  async save(event: AgendaEvent): Promise<void> {
    await this.repository.save(EventMapper.toPersistence(event));
  }

  async delete(id: string): Promise<void> {
    // Las inscripciones se borran en cascada (FK_event_registrations_event_id).
    await this.repository.delete({ id });
  }
}

/**
 * En LIKE, "%" y "_" son comodines y "\" es el escape. Se escapan para que
 * lo que escribe la persona se busque como texto literal.
 */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
