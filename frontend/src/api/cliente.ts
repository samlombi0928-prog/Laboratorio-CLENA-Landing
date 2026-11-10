/** Ruta base de la API. La página y la API se sirven desde el mismo dominio. */
export const API = '/api/v1'

/** Error de un campo, tal como lo devuelve la validación de la API. */
export interface ErrorDeCampo {
  campo: string
  errores: string[]
}

/** Error con el formato único de la API: estado, código, mensaje y detalles. */
export class ErrorApi extends Error {
  readonly estado: number
  readonly codigo: string
  readonly detalles: ErrorDeCampo[]

  constructor(estado: number, codigo: string, mensaje: string, detalles: ErrorDeCampo[] = []) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.codigo = codigo
    this.detalles = detalles
  }

  /** Errores de un campo del formulario, si la API los envió. */
  erroresDe(campo: string): string[] {
    return this.detalles.find((detalle) => detalle.campo === campo)?.errores ?? []
  }
}

export interface OpcionesPedido {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  cuerpo?: unknown
  /** Token de acceso, para las rutas que exigen sesión */
  token?: string | null
}

/** Hace una petición a la API y devuelve el JSON, o lanza ErrorApi. */
export async function pedir<T>(ruta: string, opciones: OpcionesPedido = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (opciones.cuerpo !== undefined) headers['Content-Type'] = 'application/json'
  if (opciones.token) headers.Authorization = `Bearer ${opciones.token}`

  let respuesta: Response
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      credentials: 'same-origin',
    })
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  if (respuesta.status === 204) return undefined as T

  const datos: unknown = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const error = (datos ?? {}) as { codigo?: string; mensaje?: string; detalles?: unknown }
    throw new ErrorApi(
      respuesta.status,
      error.codigo ?? 'ERROR',
      error.mensaje ?? 'Ocurrió un error inesperado. Intenta de nuevo.',
      Array.isArray(error.detalles) ? (error.detalles as ErrorDeCampo[]) : [],
    )
  }
  return datos as T
}
