import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  AccessDeniedError,
  AuthenticationError,
  BusinessRuleError,
  ConflictError,
  ResourceNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import { GlobalExceptionFilter } from './global-exception.filter.js';

function createHost(url = '/api/v1/recorridos') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();
  let logErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [new ResourceNotFoundError('Recorrido', '7'), 404, 'RECURSO_NO_ENCONTRADO'],
    [new AccessDeniedError(), 403, 'ACCESO_DENEGADO'],
    [new AuthenticationError(), 401, 'NO_AUTENTICADO'],
    [
      new ConflictError('Ya existe', 'CORREO_YA_REGISTRADO'),
      409,
      'CORREO_YA_REGISTRADO',
    ],
    [new BusinessRuleError('Sin escenas', 'SIN_ESCENAS'), 422, 'SIN_ESCENAS'],
  ])('traduce %s a %i', (error, status, code) => {
    const { host, status: statusSpy, json } = createHost();

    filter.catch(error, host);

    expect(statusSpy).toHaveBeenCalledWith(status);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: status,
        codigo: code,
        mensaje: error.message,
        ruta: '/api/v1/recorridos',
      }),
    );
  });

  it('respeta el código y los detalles de una HttpException propia', () => {
    const { host, json } = createHost();
    const details = [{ campo: 'titulo', errores: ['es obligatorio'] }];

    filter.catch(
      new BadRequestException({
        codigo: 'VALIDACION',
        mensaje: 'Datos inválidos',
        detalles: details,
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 400,
        codigo: 'VALIDACION',
        mensaje: 'Datos inválidos',
        detalles: details,
      }),
    );
  });

  it('asigna un código en español a las HttpException de Nest', () => {
    const { host, json } = createHost();

    filter.catch(new NotFoundException('Cannot GET /x'), host);
    expect(json).toHaveBeenLastCalledWith(
      expect.objectContaining({
        codigo: 'NO_ENCONTRADO',
        mensaje: 'Cannot GET /x',
      }),
    );

    filter.catch(new ConflictException(), host);
    expect(json).toHaveBeenLastCalledWith(
      expect.objectContaining({ estado: 409, codigo: 'CONFLICTO' }),
    );
  });

  it('traduce al español el error de archivo demasiado grande', () => {
    const { host, json } = createHost();

    filter.catch(new PayloadTooLargeException('File too large'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 413,
        codigo: 'ARCHIVO_DEMASIADO_GRANDE',
        mensaje: 'El archivo supera el tamaño máximo permitido',
      }),
    );
  });

  it('responde 500 sin exponer el error interno y lo registra', () => {
    const { host, status, json } = createHost();

    filter.catch(new Error('contraseña de la base de datos'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.codigo).toBe('ERROR_INTERNO');
    expect(body.mensaje).not.toContain('contraseña');
    expect(logErrorSpy).toHaveBeenCalled();
  });
});
