import { type InputHTMLAttributes, useId } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-invalid' | 'aria-describedby'> {
  etiqueta: string
  /** Texto de ayuda debajo del campo, por ejemplo el largo mínimo */
  ayuda?: string
  errores?: string[]
}

/** Campo de texto con su etiqueta, su ayuda y sus errores asociados para lectores de pantalla. */
export function CampoFormulario({ etiqueta, ayuda, errores = [], ...input }: Props) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const descritoPor = [ayuda && idAyuda, errores.length > 0 && idError].filter(Boolean).join(' ')

  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        aria-invalid={errores.length > 0 || undefined}
        aria-describedby={descritoPor || undefined}
        {...input}
      />
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
      {errores.length > 0 && (
        <p id={idError} className="campo__error">
          {errores.join('. ')}
        </p>
      )}
    </div>
  )
}
