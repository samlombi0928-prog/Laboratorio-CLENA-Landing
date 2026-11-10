import { QueryFailedError, type Repository } from 'typeorm';
import type {
  RegistrationPageResult,
  RegistrationQuery,
  RegistrationRepository,
} from '../../application/registrations/ports/registration-repository.js';
import { ConflictError } from '../../domain/errors/domain-errors.js';
import type { Registration } from '../../domain/registrations/registration.js';
import { RegistrationMapper } from './registration.mapper.js';
import { RegistrationOrmEntity } from './registration.orm-entity.js';

const UNIQUE_VIOLATION = '23505';

export class TypeOrmRegistrationRepository implements RegistrationRepository {
  constructor(private readonly repository: Repository<RegistrationOrmEntity>) {}

  async addIfSeatsAvailable(
    registration: Registration,
    capacity: number,
  ): Promise<boolean> {
    try {
      return await this.repository.manager.transaction(async (manager) => {
        // Bloquea la fila del evento: las inscripciones simultáneas al mismo
        // evento esperan su turno y no pueden pasarse del cupo.
        await manager.query(
          `SELECT 1 FROM "events" WHERE "id" = $1 FOR UPDATE`,
          [registration.eventId],
        );
        const taken = await manager.countBy(RegistrationOrmEntity, {
          eventId: registration.eventId,
        });
        if (taken >= capacity) return false;

        await manager.insert(
          RegistrationOrmEntity,
          RegistrationMapper.toPersistence(registration),
        );
        return true;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new ConflictError(
          'Ese correo ya está inscrito en este evento',
          'YA_INSCRITO',
        );
      }
      throw error;
    }
  }

  async findByEvent(
    eventId: string,
    query: RegistrationQuery,
  ): Promise<RegistrationPageResult> {
    const builder = this.repository
      .createQueryBuilder('registration')
      .where('registration.eventId = :eventId', { eventId })
      .orderBy('registration.createdAt', 'ASC')
      .addOrderBy('registration.id', 'ASC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    if (query.search) {
      builder.andWhere(
        '(registration.name ILIKE :search OR registration.email ILIKE :search)',
        { search: `%${escapeLike(query.search)}%` },
      );
    }

    const [rows, total] = await builder.getManyAndCount();
    return {
      items: rows.map((row) => RegistrationMapper.toDomain(row)),
      total,
    };
  }
}

/** Escapa los comodines de LIKE para que "%" o "_" se busquen como texto. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
