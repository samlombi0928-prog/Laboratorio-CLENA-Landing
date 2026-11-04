import { useEffect, useId, useRef } from 'react'
import { Viewer, type PanoData, type ViewerConfig } from '@photo-sphere-viewer/core'
import { VisibleRangePlugin } from '@photo-sphere-viewer/visible-range-plugin'
import '@photo-sphere-viewer/core/index.css'
import type { Escena } from '../tipos/escena'
import './VisorPanoramico.css'

const TEXTOS: Record<string, string> = {
  zoom: 'Zoom',
  zoomOut: 'Alejar',
  zoomIn: 'Acercar',
  moveUp: 'Mirar arriba',
  moveDown: 'Mirar abajo',
  moveLeft: 'Mirar a la izquierda',
  moveRight: 'Mirar a la derecha',
  fullscreen: 'Pantalla completa',
  loading: 'Cargando…',
  close: 'Cerrar',
  twoFingers: 'Usa dos dedos para moverte',
  ctrlZoom: 'Usa Ctrl + rueda del mouse para acercar',
  loadError: 'No se pudo cargar la imagen de esta sala',
  webglError: 'Tu navegador no es compatible con el visor 360°',
}

/**
 * Ubica una foto normal dentro de una esfera 360° imaginaria, centrada,
 * para que el visor la trate como una panorámica parcial.
 */
function panoDataParcial(imagen: HTMLImageElement, anguloHorizontal: number): PanoData {
  const fullWidth = Math.round((imagen.width * 360) / anguloHorizontal)
  const fullHeight = Math.max(Math.round(fullWidth / 2), imagen.height)
  return {
    fullWidth,
    fullHeight,
    croppedWidth: imagen.width,
    croppedHeight: imagen.height,
    croppedX: Math.round((fullWidth - imagen.width) / 2),
    croppedY: Math.round((fullHeight - imagen.height) / 2),
  }
}

function crearVisor(contenedor: HTMLElement, escena: Escena): Viewer {
  const config: ViewerConfig = {
    container: contenedor,
    panorama: escena.imagen,
    lang: TEXTOS,
    loadingTxt: 'Cargando sala…',
    navbar: ['zoom', 'move', 'fullscreen'],
    keyboard: 'always',
  }

  if (escena.tipo === '360') {
    // Evita que se vea el hueco que deja la cámara bajo sus pies
    return new Viewer({
      ...config,
      plugins: [
        VisibleRangePlugin.withConfig({
          verticalRange: [`${escena.inclinacionMinima ?? -90}deg`, '90deg'],
        }),
      ],
    })
  }

  // Foto parcial: el giro se limita al área de la foto y el zoom máximo
  // hacia afuera es la altura que cubre, para que no se vean bordes negros
  let coberturaVertical = 90
  const visor = new Viewer({
    ...config,
    defaultZoomLvl: 0,
    panoData: (imagen) => {
      const panoData = panoDataParcial(imagen, escena.anguloHorizontal ?? 70)
      coberturaVertical = (imagen.height / panoData.fullHeight!) * 180
      return panoData
    },
    plugins: [VisibleRangePlugin.withConfig({ usePanoData: true })],
  })
  visor.addEventListener(
    'panorama-loaded',
    () => {
      visor.setOptions({ maxFov: coberturaVertical, minFov: Math.max(10, coberturaVertical / 3) })
      visor.zoom(0)
    },
    { once: true },
  )
  return visor
}

interface Props {
  escena: Escena
}

export function VisorPanoramico({ escena }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const idDescripcion = useId()

  useEffect(() => {
    const elemento = contenedor.current
    if (!elemento) return

    // Se crea un instante después: si React desmonta y vuelve a montar enseguida
    // (modo estricto), solo se crea un visor. Con dos, el segundo se queda esperando
    // la descarga cancelada del primero y nunca termina de cargar.
    let visor: Viewer | undefined
    const espera = setTimeout(() => {
      try {
        visor = crearVisor(elemento, escena)
      } catch {
        // Sin WebGL el visor ya muestra su propio mensaje de error en el contenedor
      }
    })

    return () => {
      clearTimeout(espera)
      visor?.destroy()
    }
  }, [escena])

  return (
    <section className="visor" aria-label={`Vista de ${escena.nombre}`}>
      <div
        ref={contenedor}
        className="visor__lienzo"
        role="application"
        aria-roledescription="visor 360°"
        aria-describedby={idDescripcion}
      />
      <p id={idDescripcion} className="solo-lectores">
        {escena.descripcion} Arrastra o usa las flechas del teclado para mirar alrededor.
      </p>
    </section>
  )
}
