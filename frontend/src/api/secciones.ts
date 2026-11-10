import { pedir } from './cliente'

export type TipoSeccion = 'espacio' | 'servicio' | 'horario'

export const TIPOS_SECCION: { valor: TipoSeccion; nombre: string; plural: string }[] = [
  { valor: 'espacio', nombre: 'Espacio', plural: 'Espacios' },
  { valor: 'servicio', nombre: 'Servicio', plural: 'Servicios' },
  { valor: 'horario', nombre: 'Horario', plural: 'Horarios' },
]

/** Elemento de una sección de la landing, tal como lo devuelve la API. */
export interface ElementoSeccion {
  id: string
  tipo: TipoSeccion
  titulo: string
  descripcion: string
  orden: number
  publicado: boolean
  actualizadoEn: string
}

/** Página de resultados de la API. */
export interface Pagina<T> {
  datos: T[]
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
}

export interface DatosElementoSeccion {
  titulo: string
  descripcion: string
  orden: number
  publicado: boolean
}

/** Máximo que deja pedir la API por página. */
export const MAXIMO_POR_PAGINA = 50

export function rutaSecciones(base: '/secciones' | '/secciones/gestion', filtro: { tipo?: TipoSeccion; pagina?: number; porPagina?: number }) {
  const parametros = new URLSearchParams()
  if (filtro.tipo) parametros.set('tipo', filtro.tipo)
  if (filtro.pagina) parametros.set('pagina', String(filtro.pagina))
  if (filtro.porPagina) parametros.set('porPagina', String(filtro.porPagina))
  const consulta = parametros.toString()
  return consulta ? `${base}?${consulta}` : base
}

/** Lo publicado de la landing, sin sesión. */
export function listarSeccionesPublicas() {
  return pedir<Pagina<ElementoSeccion>>(rutaSecciones('/secciones', { porPagina: MAXIMO_POR_PAGINA }))
}
