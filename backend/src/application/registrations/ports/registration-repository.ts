import type { Registration } from '../../../domain/registrations/registration.js';
import type { Page, PageRequest } from '../../common/page.js';

export interface RegistrationQuery extends PageRequest {
  /** Filtra por nombre o correo, sin distinguir mayúsculas. */
  search?: string;
}

export interface RegistrationRepository {
  /**
   * Guarda la inscripción solo si el evento todavía tiene cupo. Devuelve false
   * si ya está lleno. Dos inscripciones al mismo tiempo nunca pasan del cupo.
   * Lanza ConflictError si el correo ya está inscrito en el evento.
   */
  addIfSeatsAvailable(
    registration: Registration,
    capacity: number,
  ): Promise<boolean>;

  /** Inscripciones de un evento, de la más antigua a la más reciente. */
  findByEvent(
    eventId: string,
    query: RegistrationQuery,
  ): Promise<Page<Registration>>;
}

export const REGISTRATION_REPOSITORY = Symbol('RegistrationRepository');
