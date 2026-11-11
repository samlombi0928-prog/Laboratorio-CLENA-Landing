import type { Rol, Usuario } from '../sesion/tipos'

/** Roles que el administrador puede dar o quitar. El de administrador no se cambia desde la API. */
export type RolAsignable = Exclude<Rol, 'admin'>

export function rutaUsuarios(filtro: { buscar?: string; rol?: Rol; pagina?: number; porPagina?: number }) {
  const parametros = new URLSearchParams()
  if (filtro.buscar) parametros.set('buscar', filtro.buscar)
  if (filtro.rol) parametros.set('rol', filtro.rol)
  if (filtro.pagina) parametros.set('pagina', String(filtro.pagina))
  if (filtro.porPagina) parametros.set('porPagina', String(filtro.porPagina))
  const consulta = parametros.toString()
  return consulta ? `/usuarios?${consulta}` : '/usuarios'
}

export function rutaCambiarRol(usuario: Usuario) {
  return `/usuarios/${usuario.id}/rol`
}
