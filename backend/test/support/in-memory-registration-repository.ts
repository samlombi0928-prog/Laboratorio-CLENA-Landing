import type { Page } from '../../src/application/common/page.js';
import type {
  RegistrationQuery,
  RegistrationRepository,
} from '../../src/application/registrations/ports/registration-repository.js';
import { ConflictError } from '../../src/domain/errors/domain-errors.js';
import type { Registration } from '../../src/domain/registrations/registration.js';

export class InMemoryRegistrationRepository implements RegistrationRepository {
  readonly registrations: Registration[] = [];

  addIfSeatsAvailable(
    registration: Registration,
    capacity: number,
  ): Promise<boolean> {
    const ofEvent = this.registrations.filter(
      (r) => r.eventId === registration.eventId,
    );
    if (ofEvent.length >= capacity) return Promise.resolve(false);
    if (ofEvent.some((r) => r.email === registration.email)) {
      return Promise.reject(
        new ConflictError(
          'Ese correo ya está inscrito en este evento',
          'YA_INSCRITO',
        ),
      );
    }
    this.registrations.push(registration);
    return Promise.resolve(true);
  }

  findByEvent(
    eventId: string,
    query: RegistrationQuery,
  ): Promise<Page<Registration>> {
    const search = query.search?.toLowerCase();
    const matching = this.registrations
      .filter((r) => r.eventId === eventId)
      .filter(
        (r) =>
          !search ||
          r.name.toLowerCase().includes(search) ||
          r.email.includes(search),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const start = (query.page - 1) * query.pageSize;
    return Promise.resolve({
      items: matching.slice(start, start + query.pageSize),
      total: matching.length,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
