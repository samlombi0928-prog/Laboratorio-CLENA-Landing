import { BusinessRuleError } from '../errors/domain-errors.js';
import { EventStatus } from './event-status.js';

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

/** Campos que el personal puede cambiar de un evento. */
export interface AgendaEventChanges {
  title?: string;
  description?: string;
  location?: string;
  startsAt?: Date;
  capacity?: number;
  publishFrom?: Date;
  publishUntil?: Date;
}

/** Evento de la agenda del CLENA, al que el público se puede inscribir. */
export class AgendaEvent {
  private constructor(private readonly props: AgendaEventProps) {}

  static create(input: CreateAgendaEventProps): AgendaEvent {
    const title = validTitle(input.title);
    const description = validDescription(input.description ?? '');
    const location = validLocation(input.location);
    const capacity = validCapacity(input.capacity);
    checkPublishPeriod(input.publishFrom, input.publishUntil);
    return new AgendaEvent({
      id: input.id,
      title,
      description,
      location,
      startsAt: input.startsAt,
      capacity,
      publishFrom: input.publishFrom,
      publishUntil: input.publishUntil,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  /** Cambia solo los campos que llegan; los demás quedan igual. */
  update(changes: AgendaEventChanges, now: Date): void {
    const title =
      changes.title === undefined
        ? this.props.title
        : validTitle(changes.title);
    const description =
      changes.description === undefined
        ? this.props.description
        : validDescription(changes.description);
    const location =
      changes.location === undefined
        ? this.props.location
        : validLocation(changes.location);
    const capacity =
      changes.capacity === undefined
        ? this.props.capacity
        : validCapacity(changes.capacity);
    const publishFrom = changes.publishFrom ?? this.props.publishFrom;
    const publishUntil = changes.publishUntil ?? this.props.publishUntil;
    checkPublishPeriod(publishFrom, publishUntil);

    this.props.title = title;
    this.props.description = description;
    this.props.location = location;
    this.props.startsAt = changes.startsAt ?? this.props.startsAt;
    this.props.capacity = capacity;
    this.props.publishFrom = publishFrom;
    this.props.publishUntil = publishUntil;
    this.props.updatedAt = now;
  }

  /** Reconstruye un evento que ya existe, por ejemplo desde la base de datos. */
  static restore(props: AgendaEventProps): AgendaEvent {
    return new AgendaEvent({ ...props });
  }

  /** En qué momento de su publicación está el evento en `now`. */
  statusAt(now: Date): EventStatus {
    if (now >= this.props.startsAt || now > this.props.publishUntil) {
      return EventStatus.Closed;
    }
    return now < this.props.publishFrom
      ? EventStatus.Scheduled
      : EventStatus.Published;
  }

  /**
   * El público lo ve en la agenda, y se puede inscribir, mientras esté en su
   * periodo de publicación y todavía no haya empezado.
   */
  isPublishedAt(now: Date): boolean {
    return this.statusAt(now) === EventStatus.Published;
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

function validTitle(value: string): string {
  const title = value.trim();
  if (title.length === 0) {
    throw new BusinessRuleError('El título es obligatorio', 'TITULO_REQUERIDO');
  }
  if (title.length > EVENT_TITLE_MAX_LENGTH) {
    throw new BusinessRuleError(
      `El título puede tener máximo ${EVENT_TITLE_MAX_LENGTH} caracteres`,
      'TITULO_DEMASIADO_LARGO',
    );
  }
  return title;
}

function validDescription(value: string): string {
  const description = value.trim();
  if (description.length > EVENT_DESCRIPTION_MAX_LENGTH) {
    throw new BusinessRuleError(
      `La descripción puede tener máximo ${EVENT_DESCRIPTION_MAX_LENGTH} caracteres`,
      'DESCRIPCION_DEMASIADO_LARGA',
    );
  }
  return description;
}

function validLocation(value: string): string {
  const location = value.trim();
  if (location.length === 0) {
    throw new BusinessRuleError('El lugar es obligatorio', 'LUGAR_REQUERIDO');
  }
  if (location.length > EVENT_LOCATION_MAX_LENGTH) {
    throw new BusinessRuleError(
      `El lugar puede tener máximo ${EVENT_LOCATION_MAX_LENGTH} caracteres`,
      'LUGAR_DEMASIADO_LARGO',
    );
  }
  return location;
}

function validCapacity(capacity: number): number {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new BusinessRuleError(
      'El cupo debe ser un número entero mayor que cero',
      'CUPO_NO_VALIDO',
    );
  }
  return capacity;
}

function checkPublishPeriod(publishFrom: Date, publishUntil: Date): void {
  if (publishUntil < publishFrom) {
    throw new BusinessRuleError(
      'La fecha de fin de publicación no puede ser anterior a la de inicio',
      'PERIODO_DE_PUBLICACION_NO_VALIDO',
    );
  }
}
