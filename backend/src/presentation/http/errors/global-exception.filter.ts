import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AccessDeniedError,
  AuthenticationError,
  ConflictError,
  DomainError,
  ResourceNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import type { ErrorResponse } from './error-response.js';

const HTTP_ERROR_CODES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'SOLICITUD_INVALIDA',
  [HttpStatus.UNAUTHORIZED]: 'NO_AUTENTICADO',
  [HttpStatus.FORBIDDEN]: 'ACCESO_DENEGADO',
  [HttpStatus.NOT_FOUND]: 'NO_ENCONTRADO',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METODO_NO_PERMITIDO',
  [HttpStatus.CONFLICT]: 'CONFLICTO',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'ARCHIVO_DEMASIADO_GRANDE',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'TIPO_NO_SOPORTADO',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'REGLA_DE_NEGOCIO',
  [HttpStatus.TOO_MANY_REQUESTS]: 'DEMASIADAS_SOLICITUDES',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'ERROR_INTERNO',
};

/** Mensajes en español para errores que Nest o multer generan en inglés. */
const HTTP_DEFAULT_MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.PAYLOAD_TOO_LARGE]:
    'El archivo supera el tamaño máximo permitido',
};

type ErrorBody = Pick<ErrorResponse, 'estado' | 'codigo' | 'mensaje'> & {
  detalles?: unknown;
};

/**
 * Convierte cualquier excepción en una ErrorResponse. Los errores de dominio
 * se traducen a su estado HTTP; los inesperados se registran y responden 500
 * sin exponer detalles internos.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const path = request.originalUrl ?? request.url;

    const body = this.buildBody(exception);

    if (body.estado >= 500) {
      this.logger.error({ err: exception, ruta: path }, 'Error no controlado');
    }

    const error: ErrorResponse = {
      ...body,
      ruta: path,
      fecha: new Date().toISOString(),
    };
    response.status(body.estado).json(error);
  }

  private buildBody(exception: unknown): ErrorBody {
    if (exception instanceof DomainError) {
      return {
        estado: statusForDomainError(exception),
        codigo: exception.code,
        mensaje: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const content = exception.getResponse();
      const defaultCode = HTTP_ERROR_CODES[status] ?? `HTTP_${status}`;
      const defaultMessage = HTTP_DEFAULT_MESSAGES[status];

      if (typeof content === 'string') {
        return {
          estado: status,
          codigo: defaultCode,
          mensaje: defaultMessage ?? content,
        };
      }

      const payload = content as {
        codigo?: string;
        mensaje?: string;
        message?: string | string[];
        detalles?: unknown;
      };
      const message =
        payload.mensaje ??
        defaultMessage ??
        (Array.isArray(payload.message)
          ? payload.message.join('; ')
          : payload.message) ??
        exception.message;

      return {
        estado: status,
        codigo: payload.codigo ?? defaultCode,
        mensaje: message,
        ...(payload.detalles === undefined
          ? {}
          : { detalles: payload.detalles }),
      };
    }

    return {
      estado: HttpStatus.INTERNAL_SERVER_ERROR,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error inesperado',
    };
  }
}

function statusForDomainError(error: DomainError): number {
  if (error instanceof ResourceNotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof AuthenticationError) return HttpStatus.UNAUTHORIZED;
  if (error instanceof AccessDeniedError) return HttpStatus.FORBIDDEN;
  if (error instanceof ConflictError) return HttpStatus.CONFLICT;
  return HttpStatus.UNPROCESSABLE_ENTITY;
}
