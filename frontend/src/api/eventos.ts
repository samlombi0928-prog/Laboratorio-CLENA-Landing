import { pedir } from './cliente'
import type { Pagina } from './secciones'

/** La API calcula el estado con la hora actual; nadie lo cambia a mano. */
export type EstadoEvento = 'pendiente' | 'publicado' | 'cerrado'

export const ESTADOS_EVENTO: { valor: EstadoEvento; nombre: string; plural: string }[] = [
  { valor: 'publicado', nombre: 'Publicado', plural: 'Publicados' },
  { valor: 'pendiente', nombre: 'Pendiente', plural: 'Pendientes' },
  { valor: 'cerrado', nombre: 'Cerrado', plural: 'Cerrados' },
]

/** Evento de la agenda, tal como lo devuelve la API (fechas en UTC). */
export interface Evento {
  id: string
  titulo: string
  descripcion: string
  lugar: string
  inicio: string
  cupo: number
  publicarDesde: string
  publicarHasta: string
  estado: EstadoEvento
  actualizadoEn: string
}

/** Para crear o editar. Las fechas van en ISO 8601 con zona horaria. */
export interface DatosEvento {
  titulo: string
  descripcion: string
  lugar: string
  inicio: string
  cupo: number
  publicarDesde: string
  publicarHasta: string
}

export function rutaEventos(
  base: '/eventos' | '/eventos/gestion',
  filtro: { buscar?: string; estado?: EstadoEvento; pagina?: number; porPagina?: number } = {},
) {
  const parametros = new URLSearchParams()
  if (filtro.buscar) parametros.set('buscar', filtro.buscar)
  if (filtro.estado) parametros.set('estado', filtro.estado)
  if (filtro.pagina) parametros.set('pagina', String(filtro.pagina))
  if (filtro.porPagina) parametros.set('porPagina', String(filtro.porPagina))
  const consulta = parametros.toString()
  return consulta ? `${base}?${consulta}` : base
}

/** Agenda pública, sin sesión: solo los eventos publicados, del más próximo al más lejano. */
export function listarAgenda(filtro: { buscar?: string; pagina?: number; porPagina?: number }) {
  return pedir<Pagina<Evento>>(rutaEventos('/eventos', filtro))
}

// Los eventos son en Barranquilla: las fechas se muestran en hora de Colombia
const FECHA = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
})
const FECHA_CORTA = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
})

export const fechaLarga = (iso: string) => FECHA.format(new Date(iso))
export const fechaCorta = (iso: string) => FECHA_CORTA.format(new Date(iso))

/** De la API (UTC) al valor de un <input type="datetime-local">, en la hora del navegador. */
export function aCampoFecha(iso: string): string {
  const fecha = new Date(iso)
  return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** De un <input type="datetime-local"> (sin zona) a ISO con zona, como lo pide la API. */
export function deCampoFecha(valor: string): string {
  return new Date(valor).toISOString()
}
