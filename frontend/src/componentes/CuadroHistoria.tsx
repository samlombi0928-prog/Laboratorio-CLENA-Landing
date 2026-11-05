import { useId, useState } from 'react'
import type { FragmentoHistoria } from '../tipos/escena'
import './CuadroHistoria.css'

interface Props {
  fragmentos: FragmentoHistoria[]
  minimizado: boolean
  onMinimizar: (minimizado: boolean) => void
}

/**
 * Cuadro de la esquina inferior izquierda que cuenta la historia de la sala
 * por partes. Se debe montar con `key` de la escena para que cada sala
 * empiece desde su primer fragmento.
 */
export function CuadroHistoria({ fragmentos, minimizado, onMinimizar }: Props) {
  const [indice, setIndice] = useState(0)
  const idContenido = useId()

  if (fragmentos.length === 0) return null

  if (minimizado) {
    return (
      <button
        type="button"
        className="cuadro-historia__abrir"
        aria-expanded="false"
        onClick={() => onMinimizar(false)}
      >
        <span aria-hidden="true">📜</span> Historia de esta sala
      </button>
    )
  }

  const fragmento = fragmentos[indice]
  const total = fragmentos.length

  return (
    <aside className="cuadro-historia" aria-label="Historia de la sala">
      <div className="cuadro-historia__encabezado">
        <span className="cuadro-historia__contador">
          {indice + 1} de {total}
        </span>
        <button
          type="button"
          className="cuadro-historia__minimizar"
          aria-expanded="true"
          aria-controls={idContenido}
          aria-label="Minimizar la historia"
          onClick={() => onMinimizar(true)}
        >
          <span aria-hidden="true">–</span>
        </button>
      </div>

      <div id={idContenido} aria-live="polite">
        {fragmento.epoca && <p className="cuadro-historia__epoca">{fragmento.epoca}</p>}
        <h2 className="cuadro-historia__titulo">{fragmento.titulo}</h2>
        <p className="cuadro-historia__texto">{fragmento.texto}</p>
      </div>

      {total > 1 && (
        <div className="cuadro-historia__controles">
          <button type="button" disabled={indice === 0} onClick={() => setIndice(indice - 1)}>
            <span aria-hidden="true">←</span> Anterior
          </button>
          <button
            type="button"
            disabled={indice === total - 1}
            onClick={() => setIndice(indice + 1)}
          >
            Siguiente <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </aside>
  )
}
