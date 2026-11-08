import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useSesion } from './contexto'
import type { Rol } from './tipos'

interface Props {
  /** Roles que pueden entrar. Sin valor, basta con haber iniciado sesión. */
  roles?: Rol[]
  children: ReactNode
}

/** Solo muestra su contenido si hay sesión y el rol está permitido. */
export function RutaProtegida({ roles, children }: Props) {
  const { estado, usuario } = useSesion()
  const ubicacion = useLocation()

  if (estado === 'cargando') {
    return (
      <p className="pagina-estado" role="status">
        Cargando…
      </p>
    )
  }

  if (!usuario) {
    const volver = encodeURIComponent(ubicacion.pathname + ubicacion.search)
    return <Navigate to={`/ingresar?volver=${volver}`} replace />
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <main className="pagina-estado">
        <h1>No tienes permiso para ver esta página</h1>
        <p>Esta sección es solo para el personal del CLENA.</p>
        <Link to="/">Volver al inicio</Link>
      </main>
    )
  }

  return children
}

