import {
  AccessDeniedError,
  BusinessRuleError,
  DomainError,
  ResourceNotFoundError,
} from './domain-errors.js';

describe('Errores de dominio', () => {
  it('ResourceNotFoundError arma el mensaje con el recurso y el id', () => {
    const error = new ResourceNotFoundError('Recorrido', 'abc');

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('RECURSO_NO_ENCONTRADO');
    expect(error.message).toBe('Recorrido con id abc no existe');
    expect(error.name).toBe('ResourceNotFoundError');
  });

  it('AccessDeniedError tiene un mensaje por defecto', () => {
    const error = new AccessDeniedError();

    expect(error.code).toBe('ACCESO_DENEGADO');
    expect(error.message).toBe('No tiene permiso para realizar esta acción');
  });

  it('BusinessRuleError permite un código propio', () => {
    const generic = new BusinessRuleError('No se puede publicar');
    const custom = new BusinessRuleError(
      'El recorrido no tiene escenas',
      'RECORRIDO_SIN_ESCENAS',
    );

    expect(generic.code).toBe('REGLA_DE_NEGOCIO');
    expect(custom.code).toBe('RECORRIDO_SIN_ESCENAS');
    expect(custom.message).toBe('El recorrido no tiene escenas');
  });
});
