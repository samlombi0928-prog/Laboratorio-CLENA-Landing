import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { useSesion } from '../sesion/contexto'
import './PaginaFormulario.css'

const MINIMO_CONTRASENA = 8

export function PaginaRegistro() {
  const { registrarse } = useSesion()
  const navigate = useNavigate()
  const idPrivacidad = useId()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false)
  const [error, setError] = useState<ErrorApi | null>(null)
  const [enviando, setEnviando] = useState(false)
  const resumenError = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Crear cuenta · Recorrido CLENA'
  }, [])

  useEffect(() => {
    if (error) resumenError.current?.focus()
  }, [error])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    // El consentimiento se revisa antes de enviar, para explicar por qué hace falta
    if (!aceptaPrivacidad) {
      setError(
        new ErrorApi(422, 'CONSENTIMIENTO_REQUERIDO', 'Para crear la cuenta debes aceptar el aviso de privacidad.', [
          { campo: 'aceptaPrivacidad', errores: ['Debes aceptar el aviso de privacidad'] },
        ]),
      )
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await registrarse({ nombre, correo, contrasena, aceptaPrivacidad })
      navigate('/', { replace: true })
    } catch (falla) {
      setError(falla instanceof ErrorApi ? falla : new ErrorApi(0, 'ERROR', 'Ocurrió un error inesperado.'))
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
        <h1>Crear cuenta</h1>
        <p>Con una cuenta puedes crear y compartir tus propios recorridos. Para inscribirte a un evento no la necesitas.</p>

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
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            errores={error?.erroresDe('correo')}
          />
          <CampoFormulario
            etiqueta="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            minLength={MINIMO_CONTRASENA}
            ayuda={`Mínimo ${MINIMO_CONTRASENA} caracteres.`}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            errores={error?.erroresDe('contrasena')}
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
            <Link
              to="/aviso-de-privacidad"
              target="_blank"
              rel="noopener"
              className="campo__enlace"
            >
              Leer el aviso de privacidad (se abre en otra pestaña)
            </Link>
            {erroresPrivacidad.length > 0 && (
              <p id={`${idPrivacidad}-error`} className="campo__error">
                {erroresPrivacidad.join('. ')}
              </p>
            )}
          </div>

          <button type="submit" className="boton-principal" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="pagina-formulario__pie">
          ¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link>
        </p>
      </div>
    </main>
  )
}
