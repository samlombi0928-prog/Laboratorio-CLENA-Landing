import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { type Inscrito, rutaInscripciones } from '../api/inscripciones'
import type { Pagina } from '../api/secciones'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { useSesion } from '../sesion/contexto'
import './PaginaFormulario.css'
// La lista, la búsqueda y la paginación se ven igual que en secciones y en usuarios
import './PaginaPanelSecciones.css'
import './PaginaPanelUsuarios.css'

const POR_PAGINA = 20

const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

/** La agenda del panel enlaza aquí y pasa el título del evento en el estado del enlace. */
interface EstadoEnlace {
  titulo?: string
}

/** Personas inscritas a un evento, para el personal del CLENA (#46). */
export function PaginaPanelInscritos() {
  const { idEvento = '' } = useParams()
  const titulo = (useLocation().state as EstadoEnlace | null)?.titulo
  const { pedirConSesion } = useSesion()
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState<Pagina<Inscrito> | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Inscritos · Panel · Recorrido CLENA'
  }, [])

  const cargar = useCallback(async () => {
    try {
      setDatos(
        await pedirConSesion<Pagina<Inscrito>>(
          rutaInscripciones(idEvento, { buscar: buscar || undefined, pagina, porPagina: POR_PAGINA }),
        ),
      )
      setErrorCarga(null)
    } catch (error) {
      setDatos(null)
      if (error instanceof ErrorApi && error.estado === 404) setErrorCarga('Este evento no existe.')
      else setErrorCarga(error instanceof ErrorApi ? error.message : 'No se pudo cargar la lista.')
    }
  }, [pedirConSesion, idEvento, buscar, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function enviarBusqueda(evento: FormEvent) {
    evento.preventDefault()
    setBuscar(textoBusqueda.trim())
    setPagina(1)
  }

  return (
    <main className="panel">
      <Link to="/panel" className="pagina-formulario__volver">
        <span aria-hidden="true">←</span> Volver al panel
      </Link>

      <header className="panel__encabezado">
        <div>
          <h1>Inscritos</h1>
          <p>{titulo ?? 'Personas inscritas a este evento.'}</p>
        </div>
      </header>

      <form className="panel-usuarios__busqueda" role="search" onSubmit={enviarBusqueda}>
        <CampoFormulario
          etiqueta="Buscar por nombre o correo"
          type="search"
          value={textoBusqueda}
          maxLength={100}
          onChange={(evento) => setTextoBusqueda(evento.target.value)}
        />
        <button type="submit" className="boton-secundario">
          Buscar
        </button>
      </form>

      {errorCarga && (
        <div className="pagina-formulario__alerta" role="alert">
          {errorCarga}
        </div>
      )}

      {datos && (
        <p role="status">
          {datos.total === 1 ? '1 persona inscrita' : `${datos.total} personas inscritas`}
          {buscar && ` que ${datos.total === 1 ? 'coincide' : 'coinciden'} con «${buscar}»`}
        </p>
      )}

      {datos && datos.datos.length > 0 && (
        <ul className="panel-secciones__lista">
          {datos.datos.map((inscrito) => (
            <li key={inscrito.id} className="panel-secciones__elemento">
              <div className="panel-secciones__info">
                <h2>{inscrito.nombre}</h2>
                <p className="panel-usuarios__correo">{inscrito.correo}</p>
                <p className="panel-secciones__meta">Se inscribió el {FECHA.format(new Date(inscrito.creadoEn))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {datos && datos.totalPaginas > 1 && (
        <nav className="panel-secciones__paginacion" aria-label="Páginas">
          <button type="button" className="boton-secundario" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
            <span aria-hidden="true">←</span> Anterior
          </button>
          <span>
            Página {datos.pagina} de {datos.totalPaginas}
          </span>
          <button
            type="button"
            className="boton-secundario"
            disabled={pagina >= datos.totalPaginas}
            onClick={() => setPagina(pagina + 1)}
          >
            Siguiente <span aria-hidden="true">→</span>
          </button>
        </nav>
      )}
    </main>
  )
}
