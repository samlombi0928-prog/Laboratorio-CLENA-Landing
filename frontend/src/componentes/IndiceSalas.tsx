import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import './IndiceSalas.css'

interface Sala {
  id: string
  nombre: string
}

interface Props {
  salas: Sala[]
  idActual: string
  rutaDe: (idSala: string) => string
}

/** Botón que abre la lista de todas las salas para ir directo a una */
export function IndiceSalas({ salas, idActual, rutaDe }: Props) {
  const [abierto, setAbierto] = useState(false)
  const idLista = useId()
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)

  // Se cierra con Esc o al hacer clic por fuera
  useEffect(() => {
    if (!abierto) return

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }
    const alHacerClic = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }

    document.addEventListener('keydown', alPresionarTecla)
    document.addEventListener('pointerdown', alHacerClic)
    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      document.removeEventListener('pointerdown', alHacerClic)
    }
  }, [abierto])

  return (
    <div className="indice-salas" ref={contenedor}>
      <button
        ref={boton}
        type="button"
        className="indice-salas__boton"
        aria-expanded={abierto}
        aria-controls={idLista}
        onClick={() => setAbierto(!abierto)}
      >
        <span aria-hidden="true">☰</span> Salas
      </button>

      {abierto && (
        <nav id={idLista} className="indice-salas__panel" aria-label="Salas del recorrido">
          <ul>
            {salas.map((sala) => {
              const esActual = sala.id === idActual
              return (
                <li key={sala.id}>
                  <Link
                    to={rutaDe(sala.id)}
                    className="indice-salas__sala"
                    aria-current={esActual ? 'page' : undefined}
                    onClick={() => setAbierto(false)}
                  >
                    {sala.nombre}
                    {esActual && <span className="indice-salas__aqui">Estás aquí</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
