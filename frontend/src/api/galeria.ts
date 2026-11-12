import { pedir } from './cliente'
import type { Pagina } from './secciones'

/** Imagen de la galería, tal como la devuelve la API. */
export interface ImagenGaleria {
  id: string
  titulo: string
  textoAlternativo: string
  /** Dirección pública del archivo */
  imagenUrl: string
  creadoEn: string
}

/** Límites que valida la API; aquí se repiten para avisar antes de subir el archivo. */
export const TITULO_MAXIMO = 120
export const TEXTO_ALTERNATIVO_MAXIMO = 250
export const IMAGEN_MAXIMO_BYTES = 10 * 1024 * 1024
export const TIPOS_DE_IMAGEN = ['image/jpeg', 'image/png']

export function rutaGaleria(filtro: { pagina?: number; porPagina?: number }) {
  const parametros = new URLSearchParams()
  if (filtro.pagina) parametros.set('pagina', String(filtro.pagina))
  if (filtro.porPagina) parametros.set('porPagina', String(filtro.porPagina))
  const consulta = parametros.toString()
  return consulta ? `/galeria?${consulta}` : '/galeria'
}

/** Lo que se ve en la galería pública, sin sesión. */
export function listarGaleria(filtro: { pagina?: number; porPagina?: number }) {
  return pedir<Pagina<ImagenGaleria>>(rutaGaleria(filtro))
}
