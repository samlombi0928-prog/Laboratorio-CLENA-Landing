import { Link } from 'react-router'
import { useSesion } from '../sesion/contexto'
import { ROLES_PANEL } from '../sesion/tipos'
import './BarraSesion.css'

/** Enlaces de la cuenta en la esquina superior derecha de la portada. */
export function BarraSesion() {
  const { estado, usuario, salir } = useSesion()

  if (estado === 'cargando') return null

  return (
    <nav className="barra-sesion" aria-label="Cuenta">
      {usuario ? (
        <>
          <span className="barra-sesion__nombre">Hola, {usuario.nombre.split(' ')[0]}</span>
          {ROLES_PANEL.includes(usuario.rol) && <Link to="/panel">Panel</Link>}
          <button type="button" onClick={() => void salir()}>
            Salir
          </button>
        </>
      ) : (
        <>
          <Link to="/ingresar">Ingresar</Link>
          <Link to="/registro">Crear cuenta</Link>
        </>
      )}
    </nav>
  )
}
