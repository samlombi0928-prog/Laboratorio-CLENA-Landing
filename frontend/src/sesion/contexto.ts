import { createContext, useContext } from 'react'
import type { ValorSesion } from './tipos'

export const ContextoSesion = createContext<ValorSesion | null>(null)

/** Datos y acciones de la sesión. Solo funciona dentro de <ProveedorSesion>. */
export function useSesion(): ValorSesion {
  const valor = useContext(ContextoSesion)
  if (!valor) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>')
  return valor
}
