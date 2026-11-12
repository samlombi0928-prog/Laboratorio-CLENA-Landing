import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { useSesion } from '../sesion/contexto'
import { NOMBRE_ROL } from '../sesion/tipos'
import './PaginaFormulario.css'
import './PaginaMiCuenta.css'

/** Datos de la cuenta y opción de eliminarla (#16, derecho de supresión de la Ley 1581). */
export function PaginaMiCuenta() {
  const { estado, usuario, salir, pedirConSesion } = useSesion()
  const idConfirmacion = useId()
  const [eliminando, setEliminando] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [confirma, setConfirma] = useState(false)
  const [error, setError] = useState<ErrorApi | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [eliminada, setEliminada] = useState(false)
  const tituloEliminar = useRef<HTMLHeadingElement>(null)
  const resumenError = useRef<HTMLDivElement>(null)
  const avisoFinal = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Mi cuenta · Recorrido CLENA'
  }, [])

  useEffect(() => {
    if (eliminando) tituloEliminar.current?.focus()
  }, [eliminando])

  useEffect(() => {
    if (error) resumenError.current?.focus()
  }, [error])

  useEffect(() => {
    if (eliminada) avisoFinal.current?.focus()
  }, [eliminada])

  async function eliminar(evento: FormEvent) {
    evento.preventDefault()
    const faltan = [
      ...(contrasena ? [] : [{ campo: 'contrasena', errores: ['Escribe tu contraseña'] }]),
      ...(confirma ? [] : [{ campo: 'confirma', errores: ['Marca la casilla para confirmar'] }]),
    ]
    if (faltan.length > 0) {
      setError(new ErrorApi(400, 'CAMPOS_REQUERIDOS', 'Faltan datos para eliminar la cuenta.', faltan))
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await pedirConSesion('/cuenta', { metodo: 'DELETE', cuerpo: { contrasena } })
      setEliminada(true)
      // La API ya borró la sesión; esto solo limpia la que guarda la página
      await salir().catch(() => undefined)
    } catch (falla) {
      setError(falla instanceof ErrorApi ? falla : new ErrorApi(0, 'ERROR', 'Ocurrió un error inesperado. Intenta de nuevo.'))
    } finally {
      setEnviando(false)
    }
  }

  function cancelar() {
    setEliminando(false)
    setContrasena('')
    setConfirma(false)
    setError(null)
  }

  if (eliminada) {
    return (
      <main className="pagina-formulario">
        <div className="pagina-formulario__tarjeta">
          <h1 ref={avisoFinal} tabIndex={-1}>
            Tu cuenta se eliminó
          </h1>
          <p>Borramos tus datos, tus recorridos y tus inscripciones a eventos. Gracias por haber usado CLENA Digital.</p>
          <Link to="/" className="boton-secundario mi-cuenta__enlace">
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  if (estado === 'cargando') {
    return (
      <p className="pagina-estado" role="status">
        Cargando…
      </p>
    )
  }

  if (!usuario) return <Navigate to="/ingresar?volver=%2Fmi-cuenta" replace />

  const erroresContrasena = error?.erroresDe('contrasena').length
    ? error.erroresDe('contrasena')
    : error?.codigo === 'CONTRASENA_INCORRECTA'
      ? [error.message]
      : []
  const erroresConfirma = error?.erroresDe('confirma') ?? []

  return (
    <main className="pagina-formulario">
      <div className="pagina-formulario__tarjeta">
        <Link to="/" className="pagina-formulario__volver">
          <span aria-hidden="true">←</span> Volver al inicio
        </Link>
        <h1>Mi cuenta</h1>

        <dl className="mi-cuenta__datos">
          <dt>Nombre</dt>
          <dd>{usuario.nombre}</dd>
          <dt>Correo</dt>
          <dd>{usuario.correo}</dd>
          <dt>Rol</dt>
          <dd>{NOMBRE_ROL[usuario.rol]}</dd>
        </dl>

        <section className="mi-cuenta__eliminar" aria-labelledby={`${idConfirmacion}-titulo`}>
          <h2 id={`${idConfirmacion}-titulo`} ref={tituloEliminar} tabIndex={-1}>
            Eliminar mi cuenta
          </h2>
          <p>Si eliminas tu cuenta, se borran para siempre:</p>
          <ul>
            <li>tu nombre, tu correo y tu contraseña;</li>
            <li>los recorridos que creaste;</li>
            <li>tus inscripciones a eventos hechas con este correo.</li>
          </ul>
          <p>
            Las fotos que hayas subido a la galería se quedan, sin tu nombre, porque son contenido del CLENA. Esto no se
            puede deshacer.
          </p>

          {!eliminando ? (
            <button type="button" className="boton-secundario boton-peligro" onClick={() => setEliminando(true)}>
              Eliminar mi cuenta
            </button>
          ) : (
            <>
              {error && (
                <div ref={resumenError} className="pagina-formulario__alerta" role="alert" tabIndex={-1}>
                  {error.message}
                </div>
              )}
              <form onSubmit={eliminar} noValidate>
                <CampoFormulario
                  etiqueta="Tu contraseña"
                  type="password"
                  autoComplete="current-password"
                  required
                  ayuda="La pedimos otra vez para confirmar que eres tú."
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  errores={erroresContrasena}
                />
                <div className="campo campo--casilla">
                  <input
                    id={idConfirmacion}
                    type="checkbox"
                    checked={confirma}
                    onChange={(e) => setConfirma(e.target.checked)}
                    aria-invalid={erroresConfirma.length > 0 || undefined}
                    aria-describedby={erroresConfirma.length > 0 ? `${idConfirmacion}-error` : undefined}
                  />
                  <label htmlFor={idConfirmacion}>Entiendo que mi cuenta y mis datos se borran para siempre</label>
                  {erroresConfirma.length > 0 && (
                    <p id={`${idConfirmacion}-error`} className="campo__error">
                      {erroresConfirma.join('. ')}
                    </p>
                  )}
                </div>
                <div className="mi-cuenta__acciones">
                  <button type="submit" className="boton-principal boton-eliminar" disabled={enviando}>
                    {enviando ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
                  </button>
                  <button type="button" className="boton-secundario" onClick={cancelar}>
                    Cancelar
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
