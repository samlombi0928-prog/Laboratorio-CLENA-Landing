import {
  AccessDeniedError,
  AuthenticationError,
  BusinessRuleError,
  ConflictError,
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

  it('ConflictError y AuthenticationError tienen código por defecto y permiten uno propio', () => {
    expect(new ConflictError('Ya existe').code).toBe('CONFLICTO');
    expect(new ConflictError('Ya existe', 'CORREO_YA_REGISTRADO').code).toBe(
      'CORREO_YA_REGISTRADO',
    );

    const authentication = new AuthenticationError();
    expect(authentication.code).toBe('NO_AUTENTICADO');
    expect(authentication.message).toBe('No se pudo verificar su identidad');
    expect(
      new AuthenticationError(
        'Credenciales inválidas',
        'CREDENCIALES_INVALIDAS',
      ).code,
    ).toBe('CREDENCIALES_INVALIDAS');
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
