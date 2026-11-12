import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { type ImagenGaleria, listarGaleria } from '../api/galeria'
import type { Pagina } from '../api/secciones'
import { FormularioImagen } from '../componentes/FormularioImagen'
import { useSesion } from '../sesion/contexto'
import './PaginaFormulario.css'
import './PaginaPanelGaleria.css'

const POR_PAGINA = 10

/** Lo que llegó de pedir una página; la clave dice a qué página y recarga corresponde. */
type Resultado = { clave: string; datos: Pagina<ImagenGaleria> } | { clave: string; error: string }

const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

/** Panel donde el personal del CLENA sube y elimina imágenes de la galería (#47). */
export function PaginaPanelGaleria() {
  const { pedirConSesion } = useSesion()
  const [pagina, setPagina] = useState(1)
  // Sube cada vez que hay que volver a pedir la lista (después de subir o eliminar)
  const [recarga, setRecarga] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const encabezado = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Galería · Panel · Recorrido CLENA'
  }, [])

  useEffect(() => {
    // Una respuesta vieja, de otra página o de antes de la última acción, se descarta
    let vigente = true
    const clave = `${pagina}-${recarga}`
    listarGaleria({ pagina, porPagina: POR_PAGINA })
      .then((datos) => {
        if (!vigente) return
        // Si se borró lo último de la página, se vuelve a la anterior
        if (datos.datos.length === 0 && pagina > 1) {
          setPagina(pagina - 1)
          return
        }
        setResultado({ clave, datos })
      })
      .catch((error) => {
        if (!vigente) return
        setResultado({
          clave,
          error: error instanceof ErrorApi ? error.message : 'No se pudo cargar la lista.',
        })
      })
    return () => {
      vigente = false
    }
  }, [pagina, recarga])

  function avisar(texto: string) {
    setMensaje(texto)
    encabezado.current?.focus()
  }

  async function subir(datos: FormData) {
    const imagen = await pedirConSesion<ImagenGaleria>('/galeria', { metodo: 'POST', cuerpo: datos })
    setFormularioAbierto(false)
    avisar(`Se subió «${imagen.titulo}». Ya se ve en la galería.`)
    // La más nueva sale primero: se vuelve a la primera página
    setPagina(1)
    setRecarga((n) => n + 1)
  }

  async function eliminar(imagen: ImagenGaleria) {
    if (
      !window.confirm(
        `¿Eliminar «${imagen.titulo}»? Se borra de la galería y del almacenamiento. Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    try {
      await pedirConSesion(`/galeria/${imagen.id}`, { metodo: 'DELETE' })
      avisar(`Se eliminó «${imagen.titulo}».`)
      setRecarga((n) => n + 1)
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo eliminar.')
    }
  }

  const datos = resultado && 'datos' in resultado ? resultado.datos : null
  const errorCarga = resultado && 'error' in resultado ? resultado.error : null

  return (
    <main className="panel">
      <Link to="/panel" className="pagina-formulario__volver">
        <span aria-hidden="true">←</span> Volver al panel
      </Link>

      <header className="panel__encabezado">
        <div>
          <h1 ref={encabezado} tabIndex={-1}>
            Galería
          </h1>
          <p>Imágenes que se muestran en la galería pública.</p>
        </div>
        {!formularioAbierto && (
          <button type="button" className="boton-principal panel-galeria__subir" onClick={() => setFormularioAbierto(true)}>
            Subir imagen
          </button>
        )}
      </header>

      <p className="panel-galeria__mensaje" role="status">
        {mensaje}
      </p>

      {formularioAbierto && <FormularioImagen onSubir={subir} onCancelar={() => setFormularioAbierto(false)} />}

      {errorCarga && (
        <div className="pagina-formulario__alerta" role="alert">
          {errorCarga}
        </div>
      )}

      {resultado === null && <p role="status">Cargando…</p>}

      {datos && datos.datos.length === 0 && <p>Todavía no hay imágenes en la galería.</p>}

      {datos && datos.datos.length > 0 && (
        <ul className="panel-galeria__lista">
          {datos.datos.map((imagen) => (
            <li key={imagen.id} className="panel-galeria__elemento">
              <img
                className="panel-galeria__miniatura"
                src={imagen.imagenUrl}
                alt={imagen.textoAlternativo}
                loading="lazy"
                decoding="async"
              />
              <div className="panel-galeria__info">
                <h2>{imagen.titulo}</h2>
                <p className="panel-galeria__meta">Subida el {fecha.format(new Date(imagen.creadoEn))}</p>
                <p>{imagen.textoAlternativo}</p>
              </div>
              <button
                type="button"
                className="boton-secundario boton-peligro"
                aria-label={`Eliminar ${imagen.titulo}`}
                onClick={() => void eliminar(imagen)}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {datos && datos.totalPaginas > 1 && (
        <nav className="panel-galeria__paginacion" aria-label="Páginas">
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
