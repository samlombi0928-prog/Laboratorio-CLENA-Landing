import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { ErrorApi } from '../api/cliente'
import {
  IMAGEN_MAXIMO_BYTES,
  TEXTO_ALTERNATIVO_MAXIMO,
  TIPOS_DE_IMAGEN,
  TITULO_MAXIMO,
} from '../api/galeria'
import { CampoAreaTexto } from './CampoAreaTexto'
import { CampoFormulario } from './CampoFormulario'

/** Los errores del dominio llegan sin detalle por campo: se ubican por su código. */
const CAMPO_DE_CODIGO: [prefijo: string, campo: string][] = [
  ['TITULO', 'titulo'],
  ['TEXTO_ALTERNATIVO', 'textoAlternativo'],
  ['IMAGEN', 'imagen'],
  ['ARCHIVO', 'imagen'],
  ['TIPO_DE_IMAGEN', 'imagen'],
]

function erroresDelCampo(error: ErrorApi | null, campo: string): string[] {
  if (!error) return []
  const deLaValidacion = error.erroresDe(campo)
  if (deLaValidacion.length > 0) return deLaValidacion
  const campoDelCodigo = CAMPO_DE_CODIGO.find(([prefijo]) => error.codigo.startsWith(prefijo))?.[1]
  return campoDelCodigo === campo ? [error.message] : []
}

/** Revisa el archivo antes de enviarlo, para no subir 10 MB que la API va a rechazar. */
function errorDelArchivo(archivo: File | undefined): ErrorApi | null {
  if (!archivo) return new ErrorApi(0, 'IMAGEN_REQUERIDA', 'Elige una imagen.')
  if (!TIPOS_DE_IMAGEN.includes(archivo.type)) {
    return new ErrorApi(0, 'TIPO_DE_IMAGEN_NO_VALIDO', 'La imagen debe ser un archivo JPG o PNG.')
  }
  if (archivo.size > IMAGEN_MAXIMO_BYTES) {
    return new ErrorApi(0, 'ARCHIVO_DEMASIADO_GRANDE', 'La imagen puede pesar máximo 10 MB.')
  }
  return null
}

interface Props {
  /** Recibe el formulario ya armado (título, texto alternativo e imagen) */
  onSubir: (datos: FormData) => Promise<void>
  onCancelar: () => void
}

/** Formulario para subir una imagen a la galería. */
export function FormularioImagen({ onSubir, onCancelar }: Props) {
  const idArchivo = useId()
  const titulo = useRef<HTMLHeadingElement>(null)
  const archivo = useRef<HTMLInputElement>(null)
  const [textoTitulo, setTextoTitulo] = useState('')
  const [textoAlternativo, setTextoAlternativo] = useState('')
  const [error, setError] = useState<ErrorApi | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  // Al abrir el formulario, el foco va a su título para que se anuncie
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const elegido = archivo.current?.files?.[0]
    const errorLocal = errorDelArchivo(elegido)
    if (errorLocal) {
      setError(errorLocal)
      return
    }
    const datos = new FormData()
    datos.append('titulo', textoTitulo)
    datos.append('textoAlternativo', textoAlternativo)
    datos.append('imagen', elegido!)

    setSubiendo(true)
    setError(null)
    try {
      await onSubir(datos)
    } catch (falla) {
      setError(falla instanceof ErrorApi ? falla : new ErrorApi(0, 'ERROR', 'Ocurrió un error inesperado.'))
    } finally {
      setSubiendo(false)
    }
  }

  const erroresArchivo = erroresDelCampo(error, 'imagen')
  const idAyudaArchivo = `${idArchivo}-ayuda`
  const idErrorArchivo = `${idArchivo}-error`

  return (
    <section className="formulario-imagen" aria-labelledby={`${idArchivo}-titulo`}>
      <h2 id={`${idArchivo}-titulo`} ref={titulo} tabIndex={-1}>
        Subir una imagen
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
          maxLength={TITULO_MAXIMO}
          value={textoTitulo}
          onChange={(e) => setTextoTitulo(e.target.value)}
          errores={erroresDelCampo(error, 'titulo')}
        />
        <CampoAreaTexto
          etiqueta="Texto alternativo"
          required
          maxLength={TEXTO_ALTERNATIVO_MAXIMO}
          rows={3}
          ayuda="Describe lo que se ve en la imagen, para las personas que usan lector de pantalla."
          value={textoAlternativo}
          onChange={(e) => setTextoAlternativo(e.target.value)}
          errores={erroresDelCampo(error, 'textoAlternativo')}
        />

        <div className="campo">
          <label htmlFor={idArchivo}>Imagen</label>
          <input
            id={idArchivo}
            ref={archivo}
            type="file"
            accept="image/jpeg,image/png"
            required
            aria-invalid={erroresArchivo.length > 0 || undefined}
            aria-describedby={[idAyudaArchivo, erroresArchivo.length > 0 && idErrorArchivo].filter(Boolean).join(' ')}
          />
          <p id={idAyudaArchivo} className="campo__ayuda">
            JPG o PNG, de máximo 10 MB.
          </p>
          {erroresArchivo.length > 0 && (
            <p id={idErrorArchivo} className="campo__error">
              {erroresArchivo.join('. ')}
            </p>
          )}
        </div>

        <div className="formulario-imagen__acciones">
          <button type="submit" className="boton-principal" disabled={subiendo}>
            {subiendo ? 'Subiendo…' : 'Subir imagen'}
          </button>
          <button type="button" className="boton-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
