import type { Registration } from '../../../domain/registrations/registration.js';
import type { PageRequest } from '../../common/pagination.js';

export interface RegistrationQuery extends PageRequest {
  /** Filtra por nombre o correo, sin distinguir mayúsculas. */
  search?: string;
}

export interface RegistrationPageResult {
  /** Solo las inscripciones de la página pedida. */
  items: Registration[];
  /** Total de inscripciones que cumplen el filtro, en todas las páginas. */
  total: number;
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
  ): Promise<RegistrationPageResult>;
}

export const REGISTRATION_REPOSITORY = Symbol('RegistrationRepository');
