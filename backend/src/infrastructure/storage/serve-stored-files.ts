import type { NextFunction, Request, Response } from 'express';
import { isValidStorageKey } from './storage-key.js';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

type SendFileError = NodeJS.ErrnoException & { status?: number };

/**
 * Respuesta de error con el mismo formato JSON que el resto de la API. Esta
 * ruta está fuera de /api/v1, donde Nest no maneja los errores 404 y Express
 * respondería con su página HTML por defecto.
 */
function sendError(
  req: Request,
  res: Response,
  estado: number,
  codigo: string,
  mensaje: string,
): void {
  res.status(estado).json({
    estado,
    codigo,
    mensaje,
    ruta: req.originalUrl,
    fecha: new Date().toISOString(),
  });
}

function sendNotFound(req: Request, res: Response): void {
  sendError(req, res, 404, 'NO_ENCONTRADO', 'El archivo no existe');
}

/**
 * Middleware que sirve los archivos guardados: GET /archivos/<clave>.
 * Se monta con app.use('/archivos', ...), por eso req.path es la clave con una
 * "/" delante.
 *
 * - Solo sirve claves válidas (ver isValidStorageKey): el nombre sale del
 *   disco únicamente si tiene la forma <carpeta>/<uuid>.<jpg|png>.
 * - Caché de un año: la clave lleva un UUID y el contenido nunca cambia.
 * - nosniff: el navegador no puede "adivinar" que una imagen es otra cosa.
 */
export function serveStoredFiles(rootDir: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      sendError(
        req,
        res,
        405,
        'METODO_NO_PERMITIDO',
        'Los archivos solo se pueden consultar',
      );
      return;
    }

    const key = req.path.slice(1);
    if (!isValidStorageKey(key)) {
      sendNotFound(req, res);
      return;
    }

    res.sendFile(
      key,
      {
        root: rootDir,
        dotfiles: 'deny',
        maxAge: ONE_YEAR_MS,
        immutable: true,
        headers: { 'X-Content-Type-Options': 'nosniff' },
      },
      (failure?: Error) => {
        if (!failure || res.headersSent) return;
        const error = failure as SendFileError;
        if (error.code === 'ENOENT' || error.status === 404) {
          sendNotFound(req, res);
          return;
        }
        next(error);
      },
    );
  };
}
