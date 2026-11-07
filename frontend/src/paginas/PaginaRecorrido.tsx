import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { CuadroHistoria } from '../componentes/CuadroHistoria'
import { IndiceSalas } from '../componentes/IndiceSalas'
import { VisorPanoramico, type Salida } from '../componentes/VisorPanoramico'
import { escenasClena } from '../datos/recorrido-clena'

export function PaginaRecorrido() {
  const { escenaId } = useParams()
  const navigate = useNavigate()
  const escena = escenasClena.find((e) => e.id === escenaId)
  // Se mantiene al cambiar de sala: si la persona minimizó la historia, sigue minimizada
  const [historiaMinimizada, setHistoriaMinimizada] = useState(false)

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

  if (!escena) {
    return <Navigate to={`/recorrido/clena/${escenasClena[0].id}`} replace />
  }

  return (
    <main className="recorrido">
      <h1 className="recorrido__titulo" aria-live="polite">
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
      />
      <CuadroHistoria
        key={escena.id}
        fragmentos={escena.historia}
        minimizado={historiaMinimizada}
        onMinimizar={setHistoriaMinimizada}
      />
    </main>
  )
}
