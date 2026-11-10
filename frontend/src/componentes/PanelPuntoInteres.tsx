import { useEffect, useId, useRef } from 'react'
import type { PuntoInteres } from '../tipos/escena'
import './PanelPuntoInteres.css'

interface Props {
  /** Punto que se está mostrando; null cierra el panel */
  punto: PuntoInteres | null
  onCerrar: () => void
}

/**
 * Panel con la información de un objeto de la sala. Usa <dialog> modal: el
 * navegador mantiene el foco adentro, lo cierra con Esc y, al cerrarse,
 * devuelve el foco al botón que lo abrió.
 */
export function PanelPuntoInteres({ punto, onCerrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const idTexto = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (punto && !elemento.open) elemento.showModal()
    if (!punto && elemento.open) elemento.close()
  }, [punto])

  return (
    <dialog
      ref={dialogo}
      className="panel-punto"
      aria-labelledby={idTitulo}
      aria-describedby={idTexto}
      // Se cierra con Esc, con el botón o al tocar fuera del panel. Cada caso avisa de
      // inmediato, porque el evento close llega un momento después: si para entonces la
      // persona ya abrió otro objeto, ese close viejo se ignora.
      onCancel={onCerrar}
      onClose={() => {
        if (!dialogo.current?.open) onCerrar()
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      {punto && (
        <div className="panel-punto__contenido">
          <h2 id={idTitulo} className="panel-punto__titulo">
            {punto.titulo}
          </h2>
          <p id={idTexto} className="panel-punto__texto">
            {punto.texto}
          </p>
          <button type="button" className="panel-punto__cerrar" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      )}
    </dialog>
  )
}
