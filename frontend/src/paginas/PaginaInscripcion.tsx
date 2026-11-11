import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { type InscripcionCreada, inscribirse } from '../api/inscripciones'
import { CampoFormulario } from '../componentes/CampoFormulario'
import './PaginaFormulario.css'
import './PaginaInscripcion.css'

/** La agenda enlaza aquí y pasa el título del evento en el estado del enlace. */
interface EstadoEnlace {
  titulo?: string
}

function errorAmable(falla: unknown): ErrorApi {
  if (!(falla instanceof ErrorApi)) return new ErrorApi(0, 'ERROR', 'Ocurrió un error inesperado. Intenta de nuevo.')
  // La API responde 404 si el evento no existe o ya salió de su periodo de publicación
  if (falla.estado === 404) {
    return new ErrorApi(404, falla.codigo, 'Este evento no existe o ya no recibe inscripciones.')
  }
  return falla
}

/** Inscripción de una persona a un evento de la agenda (#46). No pide cuenta. */
export function PaginaInscripcion() {
  const { idEvento = '' } = useParams()
  const titulo = (useLocation().state as EstadoEnlace | null)?.titulo
  const idPrivacidad = useId()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false)
  const [error, setError] = useState<ErrorApi | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [inscripcion, setInscripcion] = useState<InscripcionCreada | null>(null)
  const resumenError = useRef<HTMLDivElement>(null)
  const confirmacion = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Inscripción a un evento · Recorrido CLENA'
  }, [])

  useEffect(() => {
    if (error) resumenError.current?.focus()
  }, [error])

  useEffect(() => {
    if (inscripcion) confirmacion.current?.focus()
  }, [inscripcion])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    // El consentimiento se revisa antes de enviar, para explicar por qué hace falta
    if (!aceptaPrivacidad) {
      setError(
        new ErrorApi(422, 'CONSENTIMIENTO_REQUERIDO', 'Para inscribirte debes aceptar el aviso de privacidad.', [
          { campo: 'aceptaPrivacidad', errores: ['Debes aceptar el aviso de privacidad'] },
        ]),
      )
      return
    }
    setEnviando(true)
    setError(null)
    try {
      setInscripcion(await inscribirse(idEvento, { nombre: nombre.trim(), correo, aceptaPrivacidad }))
    } catch (falla) {
      setError(errorAmable(falla))
    } finally {
      setEnviando(false)
    }
  }

  const erroresPrivacidad = error?.erroresDe('aceptaPrivacidad') ?? []

  return (
    <main className="pagina-formulario">
      <div className="pagina-formulario__tarjeta">
        <Link to="/" className="pagina-formulario__volver">
          <span aria-hidden="true">←</span> Volver al inicio
        </Link>

        {inscripcion ? (
          <section>
            <h1 ref={confirmacion} tabIndex={-1}>
              ¡Inscripción lista!
            </h1>
            <p>
              {inscripcion.nombre}, tu cupo en <strong>{inscripcion.eventoTitulo}</strong> está asegurado.
            </p>
            {inscripcion.correoEnviado ? (
              <p>
                Te enviamos un correo de confirmación a <strong>{inscripcion.correo}</strong>.
              </p>
            ) : (
              <p className="pagina-formulario__alerta">
                Tu inscripción quedó guardada, pero no pudimos enviarte el correo de confirmación. No hace falta que te
                inscribas de nuevo.
              </p>
            )}
            <Link to="/" className="boton-secundario inscripcion__inicio">
              Volver al inicio
            </Link>
          </section>
        ) : (
          <>
            <h1>Inscripción al evento</h1>
            {titulo && <p className="inscripcion__evento">{titulo}</p>}
            <p className="pagina-formulario__nota">
              No necesitas cuenta. Te enviaremos la confirmación a tu correo.
            </p>

            {error && (
              <div ref={resumenError} className="pagina-formulario__alerta" role="alert" tabIndex={-1}>
                {error.message}
              </div>
            )}

            <form onSubmit={enviar} noValidate>
              <CampoFormulario
                etiqueta="Nombre"
                autoComplete="name"
                required
                maxLength={100}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                errores={error?.erroresDe('nombre')}
              />
              <CampoFormulario
                etiqueta="Correo"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                errores={error?.erroresDe('correo')}
              />

              <div className="campo campo--casilla">
                <input
                  id={idPrivacidad}
                  type="checkbox"
                  checked={aceptaPrivacidad}
                  onChange={(e) => setAceptaPrivacidad(e.target.checked)}
                  aria-invalid={erroresPrivacidad.length > 0 || undefined}
                  aria-describedby={erroresPrivacidad.length > 0 ? `${idPrivacidad}-error` : undefined}
                />
                <label htmlFor={idPrivacidad}>Leí y acepto el aviso de privacidad</label>
                <Link to="/aviso-de-privacidad" target="_blank" rel="noopener" className="campo__enlace">
                  Leer el aviso de privacidad (se abre en otra pestaña)
                </Link>
                {erroresPrivacidad.length > 0 && (
                  <p id={`${idPrivacidad}-error`} className="campo__error">
                    {erroresPrivacidad.join('. ')}
                  </p>
                )}
              </div>

              <button type="submit" className="boton-principal" disabled={enviando}>
                {enviando ? 'Inscribiendo…' : 'Inscribirme'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
