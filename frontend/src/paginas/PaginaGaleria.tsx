import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { type ImagenGaleria, listarGaleria } from '../api/galeria'
import type { Pagina } from '../api/secciones'
import { VisorImagen } from '../componentes/VisorImagen'
import './PaginaGaleria.css'

const POR_PAGINA = 12

/** Resultado de pedir una página: lleva el número de página para saber si ya es el actual. */
type Resultado = { pagina: number; datos: Pagina<ImagenGaleria> } | { pagina: number; error: true }

function paginaDeLaUrl(valor: string | null): number {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 1 ? numero : 1
}

/** Galería pública del CLENA: cuadrícula con paginación y vista grande de cada imagen (#48). */
export function PaginaGaleria() {
  const [parametros, setParametros] = useSearchParams()
  const pagina = paginaDeLaUrl(parametros.get('pagina'))
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [abierta, setAbierta] = useState<ImagenGaleria | null>(null)
  const encabezado = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Galería · Recorrido CLENA'
  }, [])

  useEffect(() => {
    // Si la persona cambia de página antes de que llegue la respuesta, la vieja se descarta
    let vigente = true
    listarGaleria({ pagina, porPagina: POR_PAGINA })
      .then((datos) => vigente && setResultado({ pagina, datos }))
      .catch(() => vigente && setResultado({ pagina, error: true }))
    return () => {
      vigente = false
    }
  }, [pagina])

  function irAPagina(numero: number) {
    setParametros(numero === 1 ? {} : { pagina: String(numero) })
    // El foco pasa al título para que se anuncie el cambio y se vuelva al inicio de la lista
    encabezado.current?.focus()
  }

  const cargando = resultado === null || resultado.pagina !== pagina

  return (
    <main className="galeria">
      <Link to="/" className="galeria__volver">
        <span aria-hidden="true">←</span> Volver al inicio
      </Link>

      <h1 ref={encabezado} tabIndex={-1}>
        Galería
      </h1>
      <p className="galeria__intro">Fotos de los espacios y las actividades del CLENA.</p>

      {cargando && (
        <p className="galeria__estado" role="status">
          Cargando la galería…
        </p>
      )}

      {!cargando && 'error' in resultado && (
        <p className="galeria__estado" role="alert">
          No se pudo cargar la galería. Intenta de nuevo más tarde.
        </p>
      )}

      {!cargando && 'datos' in resultado && resultado.datos.datos.length === 0 && (
        <div className="galeria__estado">
          {pagina > 1 ? (
            <>
              <p>No hay imágenes en esta página.</p>
              <button type="button" className="boton-secundario" onClick={() => irAPagina(1)}>
                Ir a la primera página
              </button>
            </>
          ) : (
            <p>Todavía no hay imágenes en la galería.</p>
          )}
        </div>
      )}

      {!cargando && 'datos' in resultado && resultado.datos.datos.length > 0 && (
        <>
          <ul className="galeria__cuadricula">
            {resultado.datos.datos.map((imagen) => (
              <li key={imagen.id}>
                <button
                  type="button"
                  className="galeria__miniatura"
                  aria-haspopup="dialog"
                  onClick={() => setAbierta(imagen)}
                >
                  {/* El botón se anuncia solo con el título; la descripción completa la tiene la foto grande del visor */}
                  <img src={imagen.imagenUrl} alt="" loading="lazy" decoding="async" />
                  <span className="galeria__titulo">{imagen.titulo}</span>
                </button>
              </li>
            ))}
          </ul>

          {resultado.datos.totalPaginas > 1 && (
            <nav className="galeria__paginacion" aria-label="Páginas de la galería">
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

      <VisorImagen imagen={abierta} onCerrar={() => setAbierta(null)} />
    </main>
  )
}
