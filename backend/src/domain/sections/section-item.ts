import { BusinessRuleError } from '../errors/domain-errors.js';

/** Sección de la landing a la que pertenece un elemento. */
export enum SectionKind {
  /** Espacios del CLENA (museo, biblioteca, archivo…) */
  Space = 'space',
  /** Servicios que ofrece el CLENA */
  Service = 'service',
  /** Horarios de atención */
  Schedule = 'schedule',
}

export const SECTION_KINDS = Object.values(SectionKind);
export const SECTION_TITLE_MAX_LENGTH = 120;
export const SECTION_DESCRIPTION_MAX_LENGTH = 1000;
export const SECTION_ORDER_MAX = 999;

export interface SectionItemProps {
  id: string;
  kind: SectionKind;
  title: string;
  description: string;
  /** Posición dentro de su sección: los menores van primero. */
  order: number;
  /** Solo los publicados se ven en la landing. */
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionItemProps {
  id: string;
  kind: SectionKind;
  title: string;
  description: string;
  order: number;
  published: boolean;
  now: Date;
}

export interface SectionItemChanges {
  title?: string;
  description?: string;
  order?: number;
  published?: boolean;
}

function validTitle(title: string): string {
  const clean = title.trim();
  if (clean.length === 0) {
    throw new BusinessRuleError('El título es obligatorio', 'TITULO_REQUERIDO');
  }
  if (clean.length > SECTION_TITLE_MAX_LENGTH) {
    throw new BusinessRuleError(
      `El título puede tener máximo ${SECTION_TITLE_MAX_LENGTH} caracteres`,
      'TITULO_DEMASIADO_LARGO',
    );
  }
  return clean;
}

function validDescription(description: string): string {
  const clean = description.trim();
  if (clean.length === 0) {
    throw new BusinessRuleError(
      'La descripción es obligatoria',
      'DESCRIPCION_REQUERIDA',
    );
  }
  if (clean.length > SECTION_DESCRIPTION_MAX_LENGTH) {
    throw new BusinessRuleError(
      `La descripción puede tener máximo ${SECTION_DESCRIPTION_MAX_LENGTH} caracteres`,
      'DESCRIPCION_DEMASIADO_LARGA',
    );
  }
  return clean;
}

function validOrder(order: number): number {
  if (!Number.isInteger(order) || order < 0 || order > SECTION_ORDER_MAX) {
    throw new BusinessRuleError(
      `El orden debe ser un número entero entre 0 y ${SECTION_ORDER_MAX}`,
      'ORDEN_INVALIDO',
    );
  }
  return order;
}

/**
 * Elemento de una sección de la landing que el personal del CLENA administra:
 * un espacio, un servicio o un horario de atención.
 */
export class SectionItem {
  private constructor(private readonly props: SectionItemProps) {}

  static create(input: CreateSectionItemProps): SectionItem {
    return new SectionItem({
      id: input.id,
      kind: input.kind,
      title: validTitle(input.title),
      description: validDescription(input.description),
      order: validOrder(input.order),
      published: input.published,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  /** Reconstruye un elemento que ya existe, por ejemplo desde la base de datos. */
  static restore(props: SectionItemProps): SectionItem {
    return new SectionItem({ ...props });
  }

  /**
   * Cambia solo los campos que llegan; el tipo de sección no se cambia. Valida
   * todo antes de cambiar algo, para no dejar el elemento a medio actualizar.
   */
  update(changes: SectionItemChanges, now: Date): void {
    const title =
      changes.title === undefined
        ? this.props.title
        : validTitle(changes.title);
    const description =
      changes.description === undefined
        ? this.props.description
        : validDescription(changes.description);
    const order =
      changes.order === undefined
        ? this.props.order
        : validOrder(changes.order);

    this.props.title = title;
    this.props.description = description;
    this.props.order = order;
    this.props.published = changes.published ?? this.props.published;
    this.props.updatedAt = now;
  }

  get id(): string {
    return this.props.id;
  }

  get kind(): SectionKind {
    return this.props.kind;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get order(): number {
    return this.props.order;
  }

  get published(): boolean {
    return this.props.published;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
