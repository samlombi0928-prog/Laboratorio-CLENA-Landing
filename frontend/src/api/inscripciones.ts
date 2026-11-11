import { pedir } from './cliente'

export interface DatosInscripcion {
  nombre: string
  correo: string
  aceptaPrivacidad: boolean
}

/** Lo que devuelve la API al inscribirse. */
export interface InscripcionCreada {
  id: string
  eventoId: string
  eventoTitulo: string
  nombre: string
  correo: string
  creadoEn: string
  /** false si la inscripción quedó guardada pero el correo de confirmación no salió */
  correoEnviado: boolean
}

/** Persona inscrita, tal como la ve el personal del CLENA. */
export interface Inscrito {
  id: string
  nombre: string
  correo: string
  creadoEn: string
}

export function rutaInscripciones(idEvento: string, filtro: { buscar?: string; pagina?: number; porPagina?: number } = {}) {
  const parametros = new URLSearchParams()
  if (filtro.buscar) parametros.set('buscar', filtro.buscar)
  if (filtro.pagina) parametros.set('pagina', String(filtro.pagina))
  if (filtro.porPagina) parametros.set('porPagina', String(filtro.porPagina))
  const consulta = parametros.toString()
  const base = `/eventos/${encodeURIComponent(idEvento)}/inscripciones`
  return consulta ? `${base}?${consulta}` : base
}

/** Inscribirse no pide sesión: basta con el nombre, el correo y aceptar el aviso. */
export function inscribirse(idEvento: string, datos: DatosInscripcion) {
  return pedir<InscripcionCreada>(rutaInscripciones(idEvento), { metodo: 'POST', cuerpo: datos })
}
