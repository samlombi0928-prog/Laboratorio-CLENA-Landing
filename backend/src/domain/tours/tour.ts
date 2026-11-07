import { BusinessRuleError } from '../errors/domain-errors.js';
import { TourStatus } from './tour-status.js';

export const TOUR_TITLE_MAX_LENGTH = 120;
export const TOUR_DESCRIPTION_MAX_LENGTH = 2000;

export interface TourProps {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  /** Clave del archivo de portada en el almacenamiento, o null si no tiene. */
  coverKey: string | null;
  status: TourStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTourProps {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  coverKey?: string | null;
  now: Date;
}

function validTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new BusinessRuleError(
      'El título del recorrido es obligatorio',
      'TITULO_REQUERIDO',
    );
  }
  if (trimmed.length > TOUR_TITLE_MAX_LENGTH) {
    throw new BusinessRuleError(
      `El título puede tener máximo ${TOUR_TITLE_MAX_LENGTH} caracteres`,
      'TITULO_DEMASIADO_LARGO',
    );
  }
  return trimmed;
}

function validDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length > TOUR_DESCRIPTION_MAX_LENGTH) {
    throw new BusinessRuleError(
      `La descripción puede tener máximo ${TOUR_DESCRIPTION_MAX_LENGTH} caracteres`,
      'DESCRIPCION_DEMASIADO_LARGA',
    );
  }
  return trimmed;
}

/**
 * Recorrido armado por un creador. Empieza como borrador, y mientras lo sea
 * solo lo puede ver su creador.
 */
export class Tour {
  private constructor(private readonly props: TourProps) {}

  static create(input: CreateTourProps): Tour {
    return new Tour({
      id: input.id,
      ownerId: input.ownerId,
      title: validTitle(input.title),
      description: validDescription(input.description ?? ''),
      coverKey: input.coverKey ?? null,
      status: TourStatus.Draft,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  /** Reconstruye un recorrido que ya existe, por ejemplo desde la base de datos. */
  static restore(props: TourProps): Tour {
    return new Tour({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get coverKey(): string | null {
    return this.props.coverKey;
  }

  get status(): TourStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  /**
   * Un recorrido publicado lo ve cualquiera; un borrador, solo su creador.
   * `viewerId` es null cuando quien consulta no ha iniciado sesión.
   */
  isVisibleTo(viewerId: string | null): boolean {
    return (
      this.props.status === TourStatus.Published ||
      (viewerId !== null && this.isOwnedBy(viewerId))
    );
  }
}
