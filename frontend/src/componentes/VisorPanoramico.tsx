import { useEffect, useId, useRef, useState } from 'react'
import { Viewer, type PanoData, type PanoDataProvider } from '@photo-sphere-viewer/core'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { VisibleRangePlugin } from '@photo-sphere-viewer/visible-range-plugin'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import type { Escena, PuntoInteres } from '../tipos/escena'
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

/** Un punto de la escena que lleva a otra sala */
export interface Salida {
  idDestino: string
  nombreDestino: string
  yaw: number
  pitch: number
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

function crearBotonSalida(salida: Salida, alElegir: (id: string) => void): HTMLButtonElement {
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.className = 'salida'
  boton.innerHTML = '<span class="salida__flecha" aria-hidden="true">➜</span>'
  boton.append(`Ir a ${salida.nombreDestino}`)
  boton.addEventListener('click', () => alElegir(salida.idDestino))
  return boton
}

function crearBotonPunto(punto: PuntoInteres, alElegir: (punto: PuntoInteres) => void): HTMLButtonElement {
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.className = 'punto-interes'
  boton.setAttribute('aria-haspopup', 'dialog')
  boton.innerHTML = '<span class="punto-interes__icono" aria-hidden="true">i</span>'
  boton.append(punto.titulo)
  boton.addEventListener('click', () => alElegir(punto))
  return boton
}

const prefiereMenosMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  escena: Escena
  salidas: Salida[]
  onNavegar: (idEscena: string) => void
  onAbrirPunto: (punto: PuntoInteres) => void
}

export function VisorPanoramico({ escena, salidas, onNavegar, onAbrirPunto }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [visor, setVisor] = useState<Viewer | null>(null)
  const idDescripcion = useId()

  // Valores que leen los eventos del visor sin tener que volver a crearlo
  const escenaActual = useRef(escena)
  const coberturaVertical = useRef(90)
  const navegar = useRef(onNavegar)
  const abrirPunto = useRef(onAbrirPunto)
  useEffect(() => {
    escenaActual.current = escena
    navegar.current = onNavegar
    abrirPunto.current = onAbrirPunto
  })

  // El visor se crea una sola vez; al cambiar de sala solo se cambia la imagen
  useEffect(() => {
    const elemento = contenedor.current
    if (!elemento) return

    // Se crea un instante después: si React desmonta y vuelve a montar enseguida
    // (modo estricto), solo se crea un visor. Con dos, el segundo se queda esperando
    // la descarga cancelada del primero y nunca termina de cargar.
    let nuevo: Viewer | undefined
    const espera = setTimeout(() => {
      try {
        nuevo = new Viewer({
          container: elemento,
          lang: TEXTOS,
          loadingTxt: 'Cargando sala…',
          navbar: ['zoom', 'move', 'fullscreen'],
          keyboard: 'always',
          plugins: [VisibleRangePlugin, MarkersPlugin],
        })
      } catch {
        // Sin WebGL el visor ya muestra su propio mensaje de error en el contenedor
        return
      }

      // Foto parcial: el zoom máximo hacia afuera es la altura que cubre la foto,
      // para que no se vean bordes negros, y nunca más de 90° para que no se deforme
      const visorCreado = nuevo
      visorCreado.addEventListener('panorama-loaded', () => {
        if (escenaActual.current.tipo === 'parcial') {
          const maxFov = Math.min(coberturaVertical.current, 90)
          visorCreado.setOptions({ maxFov, minFov: Math.max(10, maxFov / 3) })
        } else {
          visorCreado.setOptions({ minFov: 30, maxFov: 90 })
        }
      })
      setVisor(visorCreado)
    })

    return () => {
      clearTimeout(espera)
      nuevo?.destroy()
      setVisor(null)
    }
  }, [])

  // Muestra la sala actual y sus puntos de navegación
  useEffect(() => {
    if (!visor) return

    const rango = visor.getPlugin<VisibleRangePlugin>(VisibleRangePlugin)
    const marcadores = visor.getPlugin<MarkersPlugin>(MarkersPlugin)
    // Sin WebGL el visor se crea, pero sin plugins: solo muestra el mensaje de error
    if (!rango || !marcadores) return
    marcadores.clearMarkers()

    let panoData: PanoDataProvider
    if (escena.tipo === 'parcial') {
      panoData = (imagen) => {
        const datos = panoDataParcial(imagen, escena.anguloHorizontal ?? 70)
        coberturaVertical.current = (imagen.height / datos.fullHeight!) * 180
        return datos
      }
      // Limita el giro al área de la foto
      rango.setOption('usePanoData', true)
    } else {
      panoData = (imagen) => ({ fullWidth: imagen.width, croppedX: 0, croppedY: 0 })
      rango.setOption('usePanoData', false)
      rango.setHorizontalRange(null)
      // Evita que se vea el hueco que deja la cámara bajo sus pies
      rango.setVerticalRange([`${escena.inclinacionMinima ?? -90}deg`, '90deg'])
    }

    visor
      .setPanorama(escena.imagen, {
        panoData,
        position: { yaw: 0, pitch: 0 },
        zoom: 0,
        transition: !prefiereMenosMovimiento(),
      })
      .then((completo) => {
        if (!completo) return
        marcadores.setMarkers([
          ...salidas.map((salida) => ({
            id: `salida-${salida.idDestino}`,
            element: crearBotonSalida(salida, (id) => navegar.current(id)),
            position: { yaw: `${salida.yaw}deg`, pitch: `${salida.pitch}deg` },
          })),
          ...(escena.puntosInteres ?? []).map((punto) => ({
            id: `punto-${punto.id}`,
            element: crearBotonPunto(punto, (elegido) => abrirPunto.current(elegido)),
            position: { yaw: `${punto.yaw}deg`, pitch: `${punto.pitch}deg` },
          })),
        ])
      })
      .catch(() => {
        // El visor ya muestra el mensaje de error de carga
      })
  }, [visor, escena, salidas])

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
        {escena.descripcion} Arrastra o usa las flechas del teclado para mirar alrededor, y la
        tecla Tab para llegar a los botones que llevan a otras salas o muestran información de
        un objeto.
      </p>
    </section>
  )
}
