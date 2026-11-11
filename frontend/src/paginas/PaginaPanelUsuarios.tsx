import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ErrorApi } from '../api/cliente'
import type { Pagina } from '../api/secciones'
import { type RolAsignable, rutaCambiarRol, rutaUsuarios } from '../api/usuarios'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { useSesion } from '../sesion/contexto'
import { NOMBRE_ROL, type Rol, type Usuario } from '../sesion/tipos'
import './PaginaFormulario.css'
// La lista, los filtros y la paginación se ven igual que en secciones
import './PaginaPanelSecciones.css'
import './PaginaPanelUsuarios.css'

const POR_PAGINA = 10

const FILTROS: { valor: Rol | undefined; nombre: string }[] = [
  { valor: undefined, nombre: 'Todos' },
  { valor: 'staff', nombre: 'Personal del CLENA' },
  { valor: 'public', nombre: 'Usuarios públicos' },
  { valor: 'admin', nombre: 'Administradores' },
]

/** Pantalla donde el administrador nombra o retira al personal del CLENA (#24). */
export function PaginaPanelUsuarios() {
  const { pedirConSesion } = useSesion()
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [buscar, setBuscar] = useState('')
  const [rol, setRol] = useState<Rol | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState<Pagina<Usuario> | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const encabezado = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Usuarios y roles · Panel · Recorrido CLENA'
  }, [])

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedirConSesion<Pagina<Usuario>>(
        rutaUsuarios({ buscar: buscar || undefined, rol, pagina, porPagina: POR_PAGINA }),
      )
      // Con el filtro por rol, quien cambia de rol sale de la lista y la página puede quedar vacía
      if (respuesta.datos.length === 0 && pagina > 1) {
        setPagina(pagina - 1)
        return
      }
      setDatos(respuesta)
      setErrorCarga(null)
    } catch (error) {
      setErrorCarga(error instanceof ErrorApi ? error.message : 'No se pudo cargar la lista.')
    }
  }, [pedirConSesion, buscar, rol, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function avisar(texto: string) {
    setMensaje(texto)
    encabezado.current?.focus()
  }

  function enviarBusqueda(evento: FormEvent) {
    evento.preventDefault()
    setBuscar(textoBusqueda.trim())
    setPagina(1)
  }

  function filtrar(nuevo: Rol | undefined) {
    setRol(nuevo)
    setPagina(1)
  }

  async function cambiarRol(usuario: Usuario, nuevoRol: RolAsignable) {
    if (
      nuevoRol === 'public' &&
      !window.confirm(`¿Quitarle a ${usuario.nombre} el rol de personal del CLENA? Ya no podrá entrar al panel.`)
    ) {
      return
    }
    try {
      await pedirConSesion(rutaCambiarRol(usuario), { metodo: 'PATCH', cuerpo: { rol: nuevoRol } })
      avisar(
        nuevoRol === 'staff'
          ? `${usuario.nombre} ahora es personal del CLENA. Podrá entrar al panel cuando recargue la página o en máximo 15 minutos.`
          : `${usuario.nombre} ya no es personal del CLENA.`,
      )
      await cargar()
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo cambiar el rol.')
    }
  }

  return (
    <main className="panel">
      <Link to="/panel" className="pagina-formulario__volver">
        <span aria-hidden="true">←</span> Volver al panel
      </Link>

      <header className="panel__encabezado">
        <div>
          <h1 ref={encabezado} tabIndex={-1}>
            Usuarios y roles
          </h1>
          <p>Nombra al personal del CLENA para que pueda administrar la landing.</p>
        </div>
      </header>

      <p className="panel-secciones__mensaje" role="status">
        {mensaje}
      </p>

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

      <div className="panel-secciones__filtros" role="group" aria-label="Filtrar por rol">
        {FILTROS.map((opcion) => (
          <button
            key={opcion.nombre}
            type="button"
            aria-pressed={rol === opcion.valor}
            onClick={() => filtrar(opcion.valor)}
          >
            {opcion.nombre}
          </button>
        ))}
      </div>

      {errorCarga && (
        <div className="pagina-formulario__alerta" role="alert">
          {errorCarga}
        </div>
      )}

      {datos && datos.datos.length === 0 && (
        <p>
          {buscar
            ? `No hay usuarios que coincidan con «${buscar}»${rol ? ' con este rol' : ''}.`
            : 'No hay usuarios con este rol.'}
        </p>
      )}

      {datos && datos.datos.length > 0 && (
        <ul className="panel-secciones__lista">
          {datos.datos.map((usuario) => (
            <li key={usuario.id} className="panel-secciones__elemento">
              <div className="panel-secciones__info">
                <h2>{usuario.nombre}</h2>
                <p className="panel-usuarios__correo">{usuario.correo}</p>
                <p className="panel-secciones__meta">
                  <span className="rol">{NOMBRE_ROL[usuario.rol]}</span>
                </p>
              </div>
              <div className="panel-secciones__acciones">
                {usuario.rol === 'public' && (
                  <button type="button" className="boton-secundario" onClick={() => void cambiarRol(usuario, 'staff')}>
                    Nombrar personal<span className="solo-lectores"> a {usuario.nombre}</span>
                  </button>
                )}
                {usuario.rol === 'staff' && (
                  <button
                    type="button"
                    className="boton-secundario boton-peligro"
                    onClick={() => void cambiarRol(usuario, 'public')}
                  >
                    Quitar rol<span className="solo-lectores"> de personal a {usuario.nombre}</span>
                  </button>
                )}
                {usuario.rol === 'admin' && (
                  <p className="panel-usuarios__nota">El rol de administrador no se cambia desde aquí.</p>
                )}
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
