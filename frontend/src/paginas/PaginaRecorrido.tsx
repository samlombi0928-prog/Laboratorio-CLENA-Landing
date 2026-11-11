import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { CuadroHistoria } from '../componentes/CuadroHistoria'
import { IndiceSalas } from '../componentes/IndiceSalas'
import { PanelPuntoInteres } from '../componentes/PanelPuntoInteres'
import { VisorPanoramico, type Salida } from '../componentes/VisorPanoramico'
import { escenasClena } from '../datos/recorrido-clena'
import type { PuntoInteres } from '../tipos/escena'

export function PaginaRecorrido() {
  const { escenaId } = useParams()
  const navigate = useNavigate()
  const escena = escenasClena.find((e) => e.id === escenaId)
  // Se mantiene al cambiar de sala: si la persona minimizó la historia, sigue minimizada
  const [historiaMinimizada, setHistoriaMinimizada] = useState(false)
  // Se guarda con su sala: al pasar a otra, el panel del objeto anterior ya no se muestra
  const [puntoAbierto, setPuntoAbierto] = useState<{ idSala: string; punto: PuntoInteres } | null>(null)

  const salidas = useMemo<Salida[]>(
    () =>
      (escena?.conexiones ?? []).flatMap((conexion) => {
        const destino = escenasClena.find((e) => e.id === conexion.destino)
        if (!destino) return []
        return [{ idDestino: destino.id, nombreDestino: destino.nombre, yaw: conexion.yaw, pitch: conexion.pitch }]
      }),
    [escena],
  )

  useEffect(() => {
    if (escena) document.title = `${escena.nombre} · Recorrido CLENA`
  }, [escena])

  // Al pasar a otra sala el botón que se usó desaparece; se lleva el foco al título
  // para que quien navega con teclado o lector de pantalla no vuelva al inicio de la página
  const titulo = useRef<HTMLHeadingElement>(null)
  // El título lleva la descripción de la sala: al recibir el foco, el lector dice qué se ve
  const idDescripcion = useId()
  const idSala = escena?.id
  // Solo cuenta pasar de una sala a otra: ni al entrar ni al redirigir a la primera sala
  const salaAnterior = useRef(idSala)
  useEffect(() => {
    if (idSala && salaAnterior.current && salaAnterior.current !== idSala) titulo.current?.focus()
    salaAnterior.current = idSala
  }, [idSala])

  if (!escena) {
    return <Navigate to={`/recorrido/clena/${escenasClena[0].id}`} replace />
  }

  return (
    <main className="recorrido">
      <h1
        ref={titulo}
        tabIndex={-1}
        className="recorrido__titulo"
        aria-live="polite"
        aria-describedby={idDescripcion}
      >
        Recorrido CLENA <span aria-hidden="true">·</span> {escena.nombre}
      </h1>
      <IndiceSalas
        salas={escenasClena}
        idActual={escena.id}
        rutaDe={(id) => `/recorrido/clena/${id}`}
      />
      <VisorPanoramico
        escena={escena}
        salidas={salidas}
        onNavegar={(id) => navigate(`/recorrido/clena/${id}`)}
        onAbrirPunto={(punto) => setPuntoAbierto({ idSala: escena.id, punto })}
        idDescripcion={idDescripcion}
      />
      <CuadroHistoria
        key={escena.id}
        fragmentos={escena.historia}
        minimizado={historiaMinimizada}
        onMinimizar={setHistoriaMinimizada}
      />
      <PanelPuntoInteres
        punto={puntoAbierto?.idSala === escena.id ? puntoAbierto.punto : null}
        onCerrar={() => setPuntoAbierto(null)}
      />
    </main>
  )
}
