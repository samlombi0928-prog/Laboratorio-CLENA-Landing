import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { useSesion } from '../sesion/contexto'
import { rutaInternaSegura } from '../sesion/rutas'
import { ROLES_PANEL } from '../sesion/tipos'
import './PaginaFormulario.css'

export function PaginaIngresar() {
  const { ingresar } = useSesion()
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<ErrorApi | null>(null)
  const [enviando, setEnviando] = useState(false)
  const resumenError = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Ingresar · Recorrido CLENA'
  }, [])

  useEffect(() => {
    if (error) resumenError.current?.focus()
  }, [error])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const usuario = await ingresar(correo, contrasena)
      const destino =
        rutaInternaSegura(parametros.get('volver')) ??
        (ROLES_PANEL.includes(usuario.rol) ? '/panel' : '/')
      navigate(destino, { replace: true })
    } catch (falla) {
      setError(falla instanceof ErrorApi ? falla : new ErrorApi(0, 'ERROR', 'Ocurrió un error inesperado.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="pagina-formulario">
      <div className="pagina-formulario__tarjeta">
        <Link to="/" className="pagina-formulario__volver">
          <span aria-hidden="true">←</span> Volver al inicio
        </Link>
        <h1>Ingresar</h1>

        {error && (
          <div ref={resumenError} className="pagina-formulario__alerta" role="alert" tabIndex={-1}>
            {error.message}
          </div>
        )}

        <form onSubmit={enviar} noValidate>
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
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            errores={error?.erroresDe('contrasena')}
          />
          <button type="submit" className="boton-principal" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="pagina-formulario__pie">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </main>
  )
}
