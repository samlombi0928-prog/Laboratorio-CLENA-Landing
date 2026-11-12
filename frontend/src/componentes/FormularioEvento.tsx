import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { ErrorApi } from '../api/cliente'
import { aCampoFecha, type DatosEvento, deCampoFecha, type Evento } from '../api/eventos'
import { CampoAreaTexto } from './CampoAreaTexto'
import { CampoFormulario } from './CampoFormulario'

/** Los errores del dominio llegan sin detalle por campo: se ubican por su código. */
const CAMPO_DE_CODIGO: [prefijo: string, campo: string][] = [
  ['TITULO', 'titulo'],
  ['DESCRIPCION', 'descripcion'],
  ['LUGAR', 'lugar'],
  ['CUPO', 'cupo'],
  ['PERIODO_DE_PUBLICACION', 'publicarHasta'],
]

function erroresDelCampo(error: ErrorApi | null, campo: string): string[] {
  if (!error) return []
  const deLaValidacion = error.erroresDe(campo)
  if (deLaValidacion.length > 0) return deLaValidacion
  const campoDelCodigo = CAMPO_DE_CODIGO.find(([prefijo]) => error.codigo.startsWith(prefijo))?.[1]
  return campoDelCodigo === campo ? [error.message] : []
}

/**
 * Campos obligatorios vacíos: se avisan todos aquí de una vez. Las fechas no pueden ir a la
 * API vacías, porque new Date('') no es una fecha.
 */
const OBLIGATORIOS: [campo: keyof DatosEvento, mensaje: string][] = [
  ['titulo', 'Escribe el título'],
  ['lugar', 'Escribe el lugar'],
  ['inicio', 'Indica la fecha y hora del evento'],
  ['cupo', 'Indica el cupo'],
  ['publicarDesde', 'Indica desde cuándo se publica'],
  ['publicarHasta', 'Indica hasta cuándo se publica'],
]

interface Props {
  /** Sin evento se programa uno nuevo */
  evento: Evento | null
  onGuardar: (datos: DatosEvento) => Promise<void>
  onCancelar: () => void
}

/** Formulario para programar o editar un evento de la agenda. */
export function FormularioEvento({ evento, onGuardar, onCancelar }: Props) {
  const idTitulo = useId()
  const titulo = useRef<HTMLHeadingElement>(null)
  const [campos, setCampos] = useState({
    titulo: evento?.titulo ?? '',
    descripcion: evento?.descripcion ?? '',
    lugar: evento?.lugar ?? '',
    inicio: evento ? aCampoFecha(evento.inicio) : '',
    cupo: String(evento?.cupo ?? ''),
    publicarDesde: evento ? aCampoFecha(evento.publicarDesde) : '',
    publicarHasta: evento ? aCampoFecha(evento.publicarHasta) : '',
  })
  const [error, setError] = useState<ErrorApi | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Al abrir el formulario, el foco va a su título para que se anuncie
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  const cambiar = (campo: keyof typeof campos) => (e: { target: { value: string } }) =>
    setCampos((anteriores) => ({ ...anteriores, [campo]: e.target.value }))

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const faltan = OBLIGATORIOS.filter(([campo]) => !campos[campo].trim())
    if (faltan.length > 0) {
      setError(
        new ErrorApi(
          400,
          'CAMPOS_REQUERIDOS',
          'Faltan datos por completar.',
          faltan.map(([campo, mensaje]) => ({ campo, errores: [mensaje] })),
        ),
      )
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await onGuardar({
        titulo: campos.titulo,
        descripcion: campos.descripcion,
        lugar: campos.lugar,
        inicio: deCampoFecha(campos.inicio),
        cupo: Number(campos.cupo),
        publicarDesde: deCampoFecha(campos.publicarDesde),
        publicarHasta: deCampoFecha(campos.publicarHasta),
      })
    } catch (falla) {
      setError(falla instanceof ErrorApi ? falla : new ErrorApi(0, 'ERROR', 'Ocurrió un error inesperado.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="formulario-seccion" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} ref={titulo} tabIndex={-1}>
        {evento ? `Editar «${evento.titulo}»` : 'Programar un evento'}
      </h2>

      {error && (
        <div className="pagina-formulario__alerta" role="alert">
          {error.message}
        </div>
      )}

      <form onSubmit={enviar} noValidate>
        <CampoFormulario
          etiqueta="Título"
          required
          maxLength={150}
          value={campos.titulo}
          onChange={cambiar('titulo')}
          errores={erroresDelCampo(error, 'titulo')}
        />
        <CampoAreaTexto
          etiqueta="Descripción (opcional)"
          maxLength={2000}
          rows={4}
          ayuda="Máximo 2000 caracteres."
          value={campos.descripcion}
          onChange={cambiar('descripcion')}
          errores={erroresDelCampo(error, 'descripcion')}
        />
        <CampoFormulario
          etiqueta="Lugar"
          required
          maxLength={150}
          ayuda="Por ejemplo: Sala de exposiciones"
          value={campos.lugar}
          onChange={cambiar('lugar')}
          errores={erroresDelCampo(error, 'lugar')}
        />
        <CampoFormulario
          etiqueta="Fecha y hora del evento"
          type="datetime-local"
          required
          value={campos.inicio}
          onChange={cambiar('inicio')}
          errores={erroresDelCampo(error, 'inicio')}
        />
        <CampoFormulario
          etiqueta="Cupo"
          type="number"
          inputMode="numeric"
          required
          min={1}
          ayuda="Cuántas personas se pueden inscribir."
          value={campos.cupo}
          onChange={cambiar('cupo')}
          errores={erroresDelCampo(error, 'cupo')}
        />
        <CampoFormulario
          etiqueta="Publicar desde"
          type="datetime-local"
          required
          ayuda="Desde ese momento el evento aparece en la agenda y recibe inscripciones."
          value={campos.publicarDesde}
          onChange={cambiar('publicarDesde')}
          errores={erroresDelCampo(error, 'publicarDesde')}
        />
        <CampoFormulario
          etiqueta="Publicar hasta"
          type="datetime-local"
          required
          ayuda="Después de esa fecha, o cuando el evento empiece, sale de la agenda."
          value={campos.publicarHasta}
          onChange={cambiar('publicarHasta')}
          errores={erroresDelCampo(error, 'publicarHasta')}
        />

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
