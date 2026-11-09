import { type TextareaHTMLAttributes, useId } from 'react'

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'aria-invalid' | 'aria-describedby'> {
  etiqueta: string
  ayuda?: string
  errores?: string[]
}

/** Como CampoFormulario, pero para textos largos. */
export function CampoAreaTexto({ etiqueta, ayuda, errores = [], ...area }: Props) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const descritoPor = [ayuda && idAyuda, errores.length > 0 && idError].filter(Boolean).join(' ')

  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <textarea
        id={id}
        aria-invalid={errores.length > 0 || undefined}
        aria-describedby={descritoPor || undefined}
        {...area}
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
