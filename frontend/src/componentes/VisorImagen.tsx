import { useEffect, useId, useRef } from 'react'
import type { ImagenGaleria } from '../api/galeria'
import './VisorImagen.css'

interface Props {
  /** Imagen que se está mostrando; null cierra la vista */
  imagen: ImagenGaleria | null
  onCerrar: () => void
}

/**
 * Vista grande de una imagen de la galería, con su título. Usa <dialog> modal:
 * el navegador mantiene el foco adentro, lo cierra con Esc y, al cerrarse,
 * devuelve el foco a la miniatura que lo abrió.
 */
export function VisorImagen({ imagen, onCerrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (imagen && !elemento.open) elemento.showModal()
    if (!imagen && elemento.open) elemento.close()
  }, [imagen])

  return (
    <dialog
      ref={dialogo}
      className="visor-imagen"
      aria-labelledby={idTitulo}
      // Esc cierra el diálogo y el navegador avisa con el evento close
      onClose={() => {
        if (!dialogo.current?.open) onCerrar()
      }}
      // Tocar fuera de la imagen (el fondo oscuro) también lo cierra
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      {imagen && (
        <div className="visor-imagen__contenido">
          <img className="visor-imagen__foto" src={imagen.imagenUrl} alt={imagen.textoAlternativo} />
          <h2 id={idTitulo} className="visor-imagen__titulo">
            {imagen.titulo}
          </h2>
          <button type="button" className="visor-imagen__cerrar" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      )}
    </dialog>
  )
}
