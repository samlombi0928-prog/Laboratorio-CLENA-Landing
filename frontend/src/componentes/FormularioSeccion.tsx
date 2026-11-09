import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { ErrorApi } from '../api/cliente'
import {
  type DatosElementoSeccion,
  type ElementoSeccion,
  TIPOS_SECCION,
  type TipoSeccion,
} from '../api/secciones'
import { CampoAreaTexto } from './CampoAreaTexto'
import { CampoFormulario } from './CampoFormulario'

/** Los errores del dominio llegan sin detalle por campo: se ubican por su código. */
const CAMPO_DE_CODIGO: [prefijo: string, campo: string][] = [
  ['TITULO', 'titulo'],
  ['DESCRIPCION', 'descripcion'],
  ['ORDEN', 'orden'],
]

function erroresDelCampo(error: ErrorApi | null, campo: string): string[] {
  if (!error) return []
  const deLaValidacion = error.erroresDe(campo)
  if (deLaValidacion.length > 0) return deLaValidacion
  const campoDelCodigo = CAMPO_DE_CODIGO.find(([prefijo]) => error.codigo.startsWith(prefijo))?.[1]
  return campoDelCodigo === campo ? [error.message] : []
}

interface Props {
  /** Sin elemento se crea uno nuevo */
  elemento: ElementoSeccion | null
  onGuardar: (datos: DatosElementoSeccion & { tipo: TipoSeccion }) => Promise<void>
  onCancelar: () => void
}

/** Formulario para agregar o editar un espacio, servicio u horario. */
export function FormularioSeccion({ elemento, onGuardar, onCancelar }: Props) {
  const idTipo = useId()
  const idPublicado = useId()
  const titulo = useRef<HTMLHeadingElement>(null)
  const [tipo, setTipo] = useState<TipoSeccion>(elemento?.tipo ?? 'servicio')
  const [textoTitulo, setTextoTitulo] = useState(elemento?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(elemento?.descripcion ?? '')
  const [orden, setOrden] = useState(String(elemento?.orden ?? 0))
  const [publicado, setPublicado] = useState(elemento?.publicado ?? true)
  const [error, setError] = useState<ErrorApi | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Al abrir el formulario, el foco va a su título para que se anuncie
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await onGuardar({
        tipo,
        titulo: textoTitulo,
        descripcion,
        orden: Number(orden),
        publicado,
      })
    } catch (falla) {
      setError(falla instanceof ErrorApi ? falla : new ErrorApi(0, 'ERROR', 'Ocurrió un error inesperado.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="formulario-seccion" aria-labelledby={`${idTipo}-titulo`}>
      <h2 id={`${idTipo}-titulo`} ref={titulo} tabIndex={-1}>
        {elemento ? `Editar «${elemento.titulo}»` : 'Agregar a la landing'}
      </h2>

      {error && (
        <div className="pagina-formulario__alerta" role="alert">
          {error.message}
        </div>
      )}

      <form onSubmit={enviar} noValidate>
        {!elemento && (
          <div className="campo">
            <label htmlFor={idTipo}>Sección</label>
            <select id={idTipo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoSeccion)}>
              {TIPOS_SECCION.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <CampoFormulario
          etiqueta="Título"
          required
          maxLength={120}
          ayuda={tipo === 'horario' ? 'Por ejemplo: Lunes a viernes' : undefined}
          value={textoTitulo}
          onChange={(e) => setTextoTitulo(e.target.value)}
          errores={erroresDelCampo(error, 'titulo')}
        />
        <CampoAreaTexto
          etiqueta="Descripción"
          required
          maxLength={1000}
          rows={4}
          ayuda={tipo === 'horario' ? 'Por ejemplo: 8:00 a. m. a 5:00 p. m.' : 'Máximo 1000 caracteres.'}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          errores={erroresDelCampo(error, 'descripcion')}
        />
        <CampoFormulario
          etiqueta="Orden"
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          ayuda="Los números menores salen primero en su sección."
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          errores={erroresDelCampo(error, 'orden')}
        />

        <div className="campo campo--casilla">
          <input
            id={idPublicado}
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
          />
          <label htmlFor={idPublicado}>Publicado (se ve en la landing)</label>
        </div>

        <div className="formulario-seccion__acciones">
          <button type="submit" className="boton-principal" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="boton-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
