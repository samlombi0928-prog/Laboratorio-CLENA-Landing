import { Navigate, Route, Routes } from 'react-router'
import { PaginaAvisoPrivacidad } from './paginas/PaginaAvisoPrivacidad'
import { PaginaIngresar } from './paginas/PaginaIngresar'
import { PaginaPanel } from './paginas/PaginaPanel'
import { PaginaPortada } from './paginas/PaginaPortada'
import { PaginaRecorrido } from './paginas/PaginaRecorrido'
import { PaginaRegistro } from './paginas/PaginaRegistro'
import { RutaProtegida } from './sesion/RutaProtegida'
import { ROLES_PANEL } from './sesion/tipos'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PaginaPortada />} />
      <Route path="/recorrido/clena/:escenaId?" element={<PaginaRecorrido />} />
      <Route path="/ingresar" element={<PaginaIngresar />} />
      <Route path="/registro" element={<PaginaRegistro />} />
      <Route path="/aviso-de-privacidad" element={<PaginaAvisoPrivacidad />} />
      <Route
        path="/panel"
        element={
          <RutaProtegida roles={ROLES_PANEL}>
            <PaginaPanel />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
