import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { type Evento, fechaLarga, listarAgenda } from '../api/eventos'
import type { Pagina } from '../api/secciones'
import { CampoFormulario } from '../componentes/CampoFormulario'
import './PaginaFormulario.css'
// La búsqueda y la paginación se ven igual que en el panel
import './PaginaPanelSecciones.css'
import './PaginaPanelUsuarios.css'
import './PaginaAgenda.css'

const POR_PAGINA = 10

/** Resultado de pedir una página: lleva la consulta para saber si ya es la actual. */
type Resultado = { clave: string; datos: Pagina<Evento> } | { clave: string; error: true }

/** Agenda pública del CLENA: eventos publicados por fecha, con enlace para inscribirse (#45). */
export function PaginaAgenda() {
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const encabezado = useRef<HTMLHeadingElement>(null)
  const clave = `${buscar}|${pagina}`

  useEffect(() => {
    document.title = 'Agenda · Recorrido CLENA'
  }, [])

  useEffect(() => {
    // Si la persona cambia la búsqueda antes de que llegue la respuesta, la vieja se descarta
    let vigente = true
    listarAgenda({ buscar: buscar || undefined, pagina, porPagina: POR_PAGINA })
      .then((datos) => vigente && setResultado({ clave, datos }))
      .catch(() => vigente && setResultado({ clave, error: true }))
    return () => {
      vigente = false
    }
  }, [buscar, pagina, clave])

  function enviarBusqueda(evento: FormEvent) {
    evento.preventDefault()
    setBuscar(textoBusqueda.trim())
    setPagina(1)
  }

  function irAPagina(numero: number) {
    setPagina(numero)
    // El foco pasa al título para que se anuncie el cambio y se vuelva al inicio de la lista
    encabezado.current?.focus()
  }

  const cargando = resultado === null || resultado.clave !== clave

  return (
    <main className="agenda">
      <Link to="/" className="pagina-formulario__volver">
        <span aria-hidden="true">←</span> Volver al inicio
      </Link>

      <h1 ref={encabezado} tabIndex={-1}>
        Agenda
      </h1>
      <p className="agenda__intro">
        Eventos del CLENA abiertos al público. Para inscribirte no necesitas cuenta.
      </p>

      <form className="panel-usuarios__busqueda" role="search" onSubmit={enviarBusqueda}>
        <CampoFormulario
          etiqueta="Buscar por nombre o lugar"
          type="search"
          value={textoBusqueda}
          maxLength={100}
          onChange={(evento) => setTextoBusqueda(evento.target.value)}
        />
        <button type="submit" className="boton-secundario">
          Buscar
        </button>
      </form>

      {cargando && <p role="status">Cargando la agenda…</p>}

      {!cargando && 'error' in resultado && (
        <p className="pagina-formulario__alerta" role="alert">
          No se pudo cargar la agenda. Intenta de nuevo más tarde.
        </p>
      )}

      {!cargando && 'datos' in resultado && resultado.datos.datos.length === 0 && (
        <p role="status">
          {buscar
            ? `No hay eventos que coincidan con «${buscar}».`
            : 'Por ahora no hay eventos programados. Vuelve pronto.'}
        </p>
      )}

      {!cargando && 'datos' in resultado && resultado.datos.datos.length > 0 && (
        <>
          <ul className="agenda__lista">
            {resultado.datos.datos.map((evento) => (
              <li key={evento.id} className="agenda__evento">
                <h2>{evento.titulo}</h2>
                <p className="agenda__cuando">
                  <time dateTime={evento.inicio}>{fechaLarga(evento.inicio)}</time>
                </p>
                <p className="agenda__lugar">{evento.lugar}</p>
                {evento.descripcion && <p>{evento.descripcion}</p>}
                <Link
                  to={`/eventos/${evento.id}/inscripcion`}
                  state={{ titulo: evento.titulo }}
                  className="boton-principal agenda__inscribirme"
                >
                  Inscribirme<span className="solo-lectores"> a {evento.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>

          {resultado.datos.totalPaginas > 1 && (
            <nav className="panel-secciones__paginacion" aria-label="Páginas de la agenda">
              <button
                type="button"
                className="boton-secundario"
                disabled={pagina <= 1}
                onClick={() => irAPagina(pagina - 1)}
              >
                <span aria-hidden="true">←</span> Anterior
              </button>
              <span>
                Página {resultado.datos.pagina} de {resultado.datos.totalPaginas}
              </span>
              <button
                type="button"
                className="boton-secundario"
                disabled={pagina >= resultado.datos.totalPaginas}
                onClick={() => irAPagina(pagina + 1)}
              >
                Siguiente <span aria-hidden="true">→</span>
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}
