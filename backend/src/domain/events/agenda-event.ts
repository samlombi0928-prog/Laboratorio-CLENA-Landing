import { BusinessRuleError } from '../errors/domain-errors.js';

export const EVENT_TITLE_MAX_LENGTH = 150;
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000;
export const EVENT_LOCATION_MAX_LENGTH = 150;

export interface AgendaEventProps {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  /** Cupos para inscribirse. */
  capacity: number;
  /** El evento aparece en la agenda desde publishFrom hasta publishUntil. */
  publishFrom: Date;
  publishUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgendaEventProps {
  id: string;
  title: string;
  description?: string;
  location: string;
  startsAt: Date;
  capacity: number;
  publishFrom: Date;
  publishUntil: Date;
  now: Date;
}

/** Evento de la agenda del CLENA, al que el público se puede inscribir. */
export class AgendaEvent {
  private constructor(private readonly props: AgendaEventProps) {}

  static create(input: CreateAgendaEventProps): AgendaEvent {
    const title = input.title.trim();
    if (title.length === 0) {
      throw new BusinessRuleError(
        'El título es obligatorio',
        'TITULO_REQUERIDO',
      );
    }
    if (title.length > EVENT_TITLE_MAX_LENGTH) {
      throw new BusinessRuleError(
        `El título puede tener máximo ${EVENT_TITLE_MAX_LENGTH} caracteres`,
        'TITULO_DEMASIADO_LARGO',
      );
    }

    const description = (input.description ?? '').trim();
    if (description.length > EVENT_DESCRIPTION_MAX_LENGTH) {
      throw new BusinessRuleError(
        `La descripción puede tener máximo ${EVENT_DESCRIPTION_MAX_LENGTH} caracteres`,
        'DESCRIPCION_DEMASIADO_LARGA',
      );
    }

    const location = input.location.trim();
    if (location.length === 0) {
      throw new BusinessRuleError('El lugar es obligatorio', 'LUGAR_REQUERIDO');
    }
    if (location.length > EVENT_LOCATION_MAX_LENGTH) {
      throw new BusinessRuleError(
        `El lugar puede tener máximo ${EVENT_LOCATION_MAX_LENGTH} caracteres`,
        'LUGAR_DEMASIADO_LARGO',
      );
    }

    if (!Number.isInteger(input.capacity) || input.capacity < 1) {
      throw new BusinessRuleError(
        'El cupo debe ser un número entero mayor que cero',
        'CUPO_NO_VALIDO',
      );
    }

    if (input.publishUntil < input.publishFrom) {
      throw new BusinessRuleError(
        'La fecha de fin de publicación no puede ser anterior a la de inicio',
        'PERIODO_DE_PUBLICACION_NO_VALIDO',
      );
    }

    return new AgendaEvent({
      id: input.id,
      title,
      description,
      location,
      startsAt: input.startsAt,
      capacity: input.capacity,
      publishFrom: input.publishFrom,
      publishUntil: input.publishUntil,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  /** Reconstruye un evento que ya existe, por ejemplo desde la base de datos. */
  static restore(props: AgendaEventProps): AgendaEvent {
    return new AgendaEvent({ ...props });
  }

  /**
   * El público lo ve en la agenda, y se puede inscribir, mientras esté en su
   * periodo de publicación y todavía no haya empezado.
   */
  isPublishedAt(now: Date): boolean {
    return (
      this.props.publishFrom <= now &&
      now <= this.props.publishUntil &&
      now < this.props.startsAt
    );
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get location(): string {
    return this.props.location;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get publishFrom(): Date {
    return this.props.publishFrom;
  }

  get publishUntil(): Date {
    return this.props.publishUntil;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
