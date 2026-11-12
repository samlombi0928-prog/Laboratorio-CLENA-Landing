import { useEffect } from 'react'
import { Link } from 'react-router'
import { useSesion } from '../sesion/contexto'
import { NOMBRE_ROL } from '../sesion/tipos'
import './PaginaFormulario.css'

/** Módulos del panel. Cada funcionalidad agrega aquí el enlace a su pantalla cuando esté lista. */
const MODULOS = [
  { titulo: 'Secciones de la landing', descripcion: 'Espacios, servicios y horarios', ruta: '/panel/secciones' },
  { titulo: 'Agenda de eventos', descripcion: 'Eventos y fechas de publicación', ruta: null },
  { titulo: 'Galería', descripcion: 'Subir y eliminar imágenes', ruta: '/panel/galeria' },
  { titulo: 'Inscripciones', descripcion: 'Personas inscritas a cada evento', ruta: null },
  { titulo: 'Usuarios y roles', descripcion: 'Nombrar o retirar al personal del CLENA', ruta: '/panel/usuarios', soloAdmin: true },
] satisfies { titulo: string; descripcion: string; ruta: string | null; soloAdmin?: boolean }[]

/** Inicio del panel del personal del CLENA. Solo para personal y administradores. */
export function PaginaPanel() {
  const { usuario, salir } = useSesion()

  useEffect(() => {
    document.title = 'Panel · Recorrido CLENA'
  }, [])

  return (
    <main className="panel">
      <header className="panel__encabezado">
        <div>
          <h1>Panel del CLENA</h1>
          {usuario && (
            <p>
              {usuario.nombre} · {NOMBRE_ROL[usuario.rol]}
            </p>
          )}
        </div>
        <div className="panel__acciones">
          <Link to="/">Ver la landing</Link>
          <button type="button" className="boton-secundario" onClick={() => void salir()}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <ul className="panel__modulos">
        {MODULOS.filter((modulo) => !('soloAdmin' in modulo) || usuario?.rol === 'admin').map((modulo) => (
          <li key={modulo.titulo}>
            {modulo.ruta ? (
              <Link to={modulo.ruta} className="panel__modulo">
                <strong>{modulo.titulo}</strong>
                <span>{modulo.descripcion}</span>
              </Link>
            ) : (
              <div className="panel__modulo panel__modulo--pendiente">
                <strong>{modulo.titulo}</strong>
                <span>{modulo.descripcion}</span>
                <span className="panel__etiqueta">Próximamente</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
