import { VisorPanoramico } from './componentes/VisorPanoramico'
import { escenasClena } from './datos/recorrido-clena'

function App() {
  const escena = escenasClena[0]

  return (
    <main className="recorrido">
      <h1 className="recorrido__titulo">
        Recorrido CLENA <span aria-hidden="true">·</span> {escena.nombre}
      </h1>
      <VisorPanoramico escena={escena} />
    </main>
  )
}

export default App
