import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { type DatosEvento, ESTADOS_EVENTO, type EstadoEvento, type Evento, fechaCorta, rutaEventos } from '../api/eventos'
import type { Pagina } from '../api/secciones'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { FormularioEvento } from '../componentes/FormularioEvento'
import { useSesion } from '../sesion/contexto'
import './PaginaFormulario.css'
// La lista, los filtros y la paginación se ven igual que en secciones y en usuarios
import './PaginaPanelSecciones.css'
import './PaginaPanelUsuarios.css'
import './PaginaPanelAgenda.css'

const POR_PAGINA = 10

const NOMBRE_ESTADO = Object.fromEntries(ESTADOS_EVENTO.map((e) => [e.valor, e.nombre])) as Record<EstadoEvento, string>

/** Formulario abierto: null si está cerrado; con evento null si es uno nuevo. */
type Edicion = { evento: Evento | null } | null

/** Panel donde el personal del CLENA programa los eventos de la agenda (#44). */
export function PaginaPanelAgenda() {
  const { pedirConSesion } = useSesion()
  const [estado, setEstado] = useState<EstadoEvento | undefined>(undefined)
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState<Pagina<Evento> | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [edicion, setEdicion] = useState<Edicion>(null)
  const [mensaje, setMensaje] = useState('')
  const encabezado = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Agenda · Panel · Recorrido CLENA'
  }, [])

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedirConSesion<Pagina<Evento>>(
        rutaEventos('/eventos/gestion', { estado, buscar: buscar || undefined, pagina, porPagina: POR_PAGINA }),
      )
      // Si se borró lo último de la página, se vuelve a la anterior
      if (respuesta.datos.length === 0 && pagina > 1) {
        setPagina(pagina - 1)
        return
      }
      setDatos(respuesta)
      setErrorCarga(null)
    } catch (error) {
      setErrorCarga(error instanceof ErrorApi ? error.message : 'No se pudo cargar la agenda.')
    }
  }, [pedirConSesion, estado, buscar, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function avisar(texto: string) {
    setMensaje(texto)
    encabezado.current?.focus()
  }

  async function guardar(datosFormulario: DatosEvento) {
    const evento = edicion?.evento
    if (evento) {
      await pedirConSesion(`/eventos/${evento.id}`, { metodo: 'PATCH', cuerpo: datosFormulario })
    } else {
      await pedirConSesion('/eventos', { metodo: 'POST', cuerpo: datosFormulario })
    }
    setEdicion(null)
    avisar(`Se guardó «${datosFormulario.titulo.trim()}».`)
    await cargar()
  }

  async function eliminar(evento: Evento) {
    const pregunta = `¿Eliminar «${evento.titulo}»? También se eliminan todas sus inscripciones. Esta acción no se puede deshacer.`
    if (!window.confirm(pregunta)) return
    try {
      await pedirConSesion(`/eventos/${evento.id}`, { metodo: 'DELETE' })
      avisar(`Se eliminó «${evento.titulo}».`)
      await cargar()
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo eliminar.')
    }
  }

  function filtrar(nuevo: EstadoEvento | undefined) {
    setEstado(nuevo)
    setPagina(1)
  }

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
          <h1 ref={encabezado} tabIndex={-1}>
            Agenda de eventos
          </h1>
          <p>Cada evento sale en la agenda pública solo dentro de sus fechas de publicación.</p>
        </div>
        {!edicion && (
          <button type="button" className="boton-principal panel-secciones__agregar" onClick={() => setEdicion({ evento: null })}>
            Programar evento
          </button>
        )}
      </header>

      <p className="panel-secciones__mensaje" role="status">
        {mensaje}
      </p>

      {edicion && (
        <FormularioEvento
          key={edicion.evento?.id ?? 'nuevo'}
          evento={edicion.evento}
          onGuardar={guardar}
          onCancelar={() => setEdicion(null)}
        />
      )}

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

      <div className="panel-secciones__filtros" role="group" aria-label="Filtrar por estado">
        <button type="button" aria-pressed={estado === undefined} onClick={() => filtrar(undefined)}>
          Todos
        </button>
        {ESTADOS_EVENTO.map((opcion) => (
          <button key={opcion.valor} type="button" aria-pressed={estado === opcion.valor} onClick={() => filtrar(opcion.valor)}>
            {opcion.plural}
          </button>
        ))}
      </div>

      {errorCarga && (
        <div className="pagina-formulario__alerta" role="alert">
          {errorCarga}
        </div>
      )}

      {datos && datos.datos.length === 0 && (
        <p>{buscar ? `No hay eventos que coincidan con «${buscar}».` : 'No hay eventos con este estado.'}</p>
      )}

      {datos && datos.datos.length > 0 && (
        <ul className="panel-secciones__lista">
          {datos.datos.map((evento) => (
            <li key={evento.id} className="panel-secciones__elemento">
              <div className="panel-secciones__info">
                <h2>{evento.titulo}</h2>
                <p className="panel-secciones__meta">
                  {fechaCorta(evento.inicio)} · {evento.lugar} · Cupo {evento.cupo} ·{' '}
                  <span className={evento.estado === 'publicado' ? 'estado' : 'estado estado--oculto'}>
                    {NOMBRE_ESTADO[evento.estado]}
                  </span>
                </p>
                <p className="panel-secciones__meta">
                  En la agenda del {fechaCorta(evento.publicarDesde)} al {fechaCorta(evento.publicarHasta)}
                </p>
              </div>
              <div className="panel-secciones__acciones">
                <Link
                  to={`/panel/eventos/${evento.id}/inscritos`}
                  state={{ titulo: evento.titulo }}
                  className="boton-secundario panel-agenda__enlace"
                >
                  Ver inscritos<span className="solo-lectores"> de {evento.titulo}</span>
                </Link>
                <button type="button" className="boton-secundario" onClick={() => setEdicion({ evento })}>
                  Editar<span className="solo-lectores"> {evento.titulo}</span>
                </button>
                <button type="button" className="boton-secundario boton-peligro" onClick={() => void eliminar(evento)}>
                  Eliminar<span className="solo-lectores"> {evento.titulo}</span>
                </button>
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
