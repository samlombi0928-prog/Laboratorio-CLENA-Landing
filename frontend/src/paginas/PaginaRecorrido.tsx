import { useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { VisorPanoramico, type Salida } from '../componentes/VisorPanoramico'
import { escenasClena } from '../datos/recorrido-clena'

export function PaginaRecorrido() {
  const { escenaId } = useParams()
  const navigate = useNavigate()
  const escena = escenasClena.find((e) => e.id === escenaId)

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
      <VisorPanoramico
        escena={escena}
        salidas={salidas}
        onNavegar={(id) => navigate(`/recorrido/clena/${id}`)}
      />
    </main>
  )
}
