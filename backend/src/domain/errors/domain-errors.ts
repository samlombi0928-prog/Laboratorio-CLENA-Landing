/**
 * Errores que lanzan las entidades y los casos de uso cuando se rompe una regla
 * del negocio. No conocen HTTP: el filtro global de la capa de presentación los
 * traduce al código de estado que corresponda.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ResourceNotFoundError extends DomainError {
  readonly code = 'RECURSO_NO_ENCONTRADO';

  constructor(resource: string, id: string) {
    super(`${resource} con id ${id} no existe`);
  }
}

export class AccessDeniedError extends DomainError {
  readonly code = 'ACCESO_DENEGADO';

  constructor(message = 'No tiene permiso para realizar esta acción') {
    super(message);
  }
}

export class BusinessRuleError extends DomainError {
  readonly code: string;

  constructor(message: string, code = 'REGLA_DE_NEGOCIO') {
    super(message);
    this.code = code;
  }
}
