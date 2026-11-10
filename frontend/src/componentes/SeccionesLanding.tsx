import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { type ElementoSeccion, listarSeccionesPublicas } from '../api/secciones'
import './SeccionesLanding.css'

type Estado =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; elementos: ElementoSeccion[] }

/** Espacios, servicios y horarios que el personal del CLENA publica desde el panel. */
export function SeccionesLanding() {
  const [datos, setDatos] = useState<Estado>({ estado: 'cargando' })

  useEffect(() => {
    let vigente = true
    listarSeccionesPublicas()
      .then((pagina) => vigente && setDatos({ estado: 'listo', elementos: pagina.datos }))
      .catch(() => vigente && setDatos({ estado: 'error' }))
    return () => {
      vigente = false
    }
  }, [])

  if (datos.estado === 'cargando') {
    return (
      <p className="secciones-landing__estado" role="status">
        Cargando información del CLENA…
      </p>
    )
  }

  if (datos.estado === 'error') {
    return (
      <p className="secciones-landing__estado" role="status">
        No se pudo cargar la información del CLENA. Intenta de nuevo más tarde.
      </p>
    )
  }

  const deTipo = (tipo: ElementoSeccion['tipo']) => datos.elementos.filter((e) => e.tipo === tipo)
  const espacios = deTipo('espacio')
  const servicios = deTipo('servicio')
  const horarios = deTipo('horario')

  return (
    <div className="secciones-landing">
      {espacios.length > 0 && (
        <section aria-labelledby="titulo-espacios" className="secciones-landing__bloque">
          <h2 id="titulo-espacios">Espacios</h2>
          <ul className="secciones-landing__tarjetas">
            {espacios.map((espacio) => (
              <li key={espacio.id} className="secciones-landing__tarjeta">
                <h3>{espacio.titulo}</h3>
                <p>{espacio.descripcion}</p>
              </li>
            ))}
          </ul>
          <Link to="/recorrido/clena" className="secciones-landing__enlace">
            Recorrer los espacios <span aria-hidden="true">➜</span>
          </Link>
        </section>
      )}

      {servicios.length > 0 && (
        <section aria-labelledby="titulo-servicios" className="secciones-landing__bloque">
          <h2 id="titulo-servicios">Servicios</h2>
          <ul className="secciones-landing__tarjetas">
            {servicios.map((servicio) => (
              <li key={servicio.id} className="secciones-landing__tarjeta">
                <h3>{servicio.titulo}</h3>
                <p>{servicio.descripcion}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {horarios.length > 0 && (
        <section aria-labelledby="titulo-horarios" className="secciones-landing__bloque">
          <h2 id="titulo-horarios">Horarios de atención</h2>
          <dl className="secciones-landing__horarios">
            {horarios.map((horario) => (
              <div key={horario.id}>
                <dt>{horario.titulo}</dt>
                <dd>{horario.descripcion}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}
