import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ErrorApi } from '../api/cliente'
import {
  type DatosElementoSeccion,
  type ElementoSeccion,
  type Pagina,
  rutaSecciones,
  TIPOS_SECCION,
  type TipoSeccion,
} from '../api/secciones'
import { FormularioSeccion } from '../componentes/FormularioSeccion'
import { useSesion } from '../sesion/contexto'
import './PaginaFormulario.css'
import './PaginaPanelSecciones.css'

const POR_PAGINA = 10

const NOMBRE_TIPO = Object.fromEntries(TIPOS_SECCION.map((t) => [t.valor, t.nombre])) as Record<TipoSeccion, string>

/** Formulario abierto: null si está cerrado; con elemento null si es uno nuevo. */
type Edicion = { elemento: ElementoSeccion | null } | null

/** Panel donde el personal del CLENA administra espacios, servicios y horarios (#42). */
export function PaginaPanelSecciones() {
  const { pedirConSesion } = useSesion()
  const [tipo, setTipo] = useState<TipoSeccion | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState<Pagina<ElementoSeccion> | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [edicion, setEdicion] = useState<Edicion>(null)
  const [mensaje, setMensaje] = useState('')
  const encabezado = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Secciones · Panel · Recorrido CLENA'
  }, [])

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedirConSesion<Pagina<ElementoSeccion>>(
        rutaSecciones('/secciones/gestion', { tipo, pagina, porPagina: POR_PAGINA }),
      )
      // Si se borró lo último de la página, se vuelve a la anterior
      if (respuesta.datos.length === 0 && pagina > 1) {
        setPagina(pagina - 1)
        return
      }
      setDatos(respuesta)
      setErrorCarga(null)
    } catch (error) {
      setErrorCarga(error instanceof ErrorApi ? error.message : 'No se pudo cargar la lista.')
    }
  }, [pedirConSesion, tipo, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function avisar(texto: string) {
    setMensaje(texto)
    encabezado.current?.focus()
  }

  async function guardar(datosFormulario: DatosElementoSeccion & { tipo: TipoSeccion }) {
    const elemento = edicion?.elemento
    if (elemento) {
      // El tipo no se puede cambiar: la API lo rechaza en una edición
      const cambios: DatosElementoSeccion = {
        titulo: datosFormulario.titulo,
        descripcion: datosFormulario.descripcion,
        orden: datosFormulario.orden,
        publicado: datosFormulario.publicado,
      }
      await pedirConSesion(`/secciones/${elemento.id}`, { metodo: 'PATCH', cuerpo: cambios })
    } else {
      await pedirConSesion('/secciones', { metodo: 'POST', cuerpo: datosFormulario })
    }
    setEdicion(null)
    avisar(`Se guardó «${datosFormulario.titulo.trim()}».`)
    await cargar()
  }

  async function cambiarPublicacion(elemento: ElementoSeccion) {
    try {
      await pedirConSesion(`/secciones/${elemento.id}`, {
        metodo: 'PATCH',
        cuerpo: { publicado: !elemento.publicado },
      })
      avisar(elemento.publicado ? `«${elemento.titulo}» ya no se ve en la landing.` : `«${elemento.titulo}» ahora se ve en la landing.`)
      await cargar()
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo cambiar.')
    }
  }

  async function eliminar(elemento: ElementoSeccion) {
    if (!window.confirm(`¿Eliminar «${elemento.titulo}»? Esta acción no se puede deshacer.`)) return
    try {
      await pedirConSesion(`/secciones/${elemento.id}`, { metodo: 'DELETE' })
      avisar(`Se eliminó «${elemento.titulo}».`)
      await cargar()
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo eliminar.')
    }
  }

  function filtrar(nuevo: TipoSeccion | undefined) {
    setTipo(nuevo)
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
            Secciones de la landing
          </h1>
          <p>Espacios, servicios y horarios que se muestran en la página principal.</p>
        </div>
        {!edicion && (
          <button type="button" className="boton-principal panel-secciones__agregar" onClick={() => setEdicion({ elemento: null })}>
            Agregar
          </button>
        )}
      </header>

      <p className="panel-secciones__mensaje" role="status">
        {mensaje}
      </p>

      {edicion && (
        <FormularioSeccion
          key={edicion.elemento?.id ?? 'nuevo'}
          elemento={edicion.elemento}
          onGuardar={guardar}
          onCancelar={() => setEdicion(null)}
        />
      )}

      <div className="panel-secciones__filtros" role="group" aria-label="Filtrar por sección">
        <button type="button" aria-pressed={tipo === undefined} onClick={() => filtrar(undefined)}>
          Todas
        </button>
        {TIPOS_SECCION.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={tipo === opcion.valor}
            onClick={() => filtrar(opcion.valor)}
          >
            {opcion.plural}
          </button>
        ))}
      </div>

      {errorCarga && (
        <div className="pagina-formulario__alerta" role="alert">
          {errorCarga}
        </div>
      )}

      {datos && datos.datos.length === 0 && <p>No hay nada en esta sección todavía.</p>}

      {datos && datos.datos.length > 0 && (
        <ul className="panel-secciones__lista">
          {datos.datos.map((elemento) => (
            <li key={elemento.id} className="panel-secciones__elemento">
              <div className="panel-secciones__info">
                <h2>{elemento.titulo}</h2>
                <p className="panel-secciones__meta">
                  {NOMBRE_TIPO[elemento.tipo]} · Orden {elemento.orden} ·{' '}
                  <span className={elemento.publicado ? 'estado estado--publicado' : 'estado estado--oculto'}>
                    {elemento.publicado ? 'Publicado' : 'Oculto'}
                  </span>
                </p>
                <p>{elemento.descripcion}</p>
              </div>
              <div className="panel-secciones__acciones">
                <button
                  type="button"
                  className="boton-secundario"
                  aria-label={`Editar ${elemento.titulo}`}
                  onClick={() => setEdicion({ elemento })}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="boton-secundario"
                  aria-label={`${elemento.publicado ? 'Ocultar' : 'Publicar'} ${elemento.titulo}`}
                  onClick={() => void cambiarPublicacion(elemento)}
                >
                  {elemento.publicado ? 'Ocultar' : 'Publicar'}
                </button>
                <button
                  type="button"
                  className="boton-secundario boton-peligro"
                  aria-label={`Eliminar ${elemento.titulo}`}
                  onClick={() => void eliminar(elemento)}
                >
                  Eliminar
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
