import { Navigate, Route, Routes } from 'react-router'
import { PaginaAgenda } from './paginas/PaginaAgenda'
import { PaginaAvisoPrivacidad } from './paginas/PaginaAvisoPrivacidad'
import { PaginaGaleria } from './paginas/PaginaGaleria'
import { PaginaIngresar } from './paginas/PaginaIngresar'
import { PaginaInscripcion } from './paginas/PaginaInscripcion'
import { PaginaPanel } from './paginas/PaginaPanel'
import { PaginaPanelAgenda } from './paginas/PaginaPanelAgenda'
import { PaginaPanelGaleria } from './paginas/PaginaPanelGaleria'
import { PaginaPanelInscritos } from './paginas/PaginaPanelInscritos'
import { PaginaPanelSecciones } from './paginas/PaginaPanelSecciones'
import { PaginaPanelUsuarios } from './paginas/PaginaPanelUsuarios'
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
      <Route path="/agenda" element={<PaginaAgenda />} />
      <Route path="/galeria" element={<PaginaGaleria />} />
      <Route path="/ingresar" element={<PaginaIngresar />} />
      <Route path="/registro" element={<PaginaRegistro />} />
      <Route path="/aviso-de-privacidad" element={<PaginaAvisoPrivacidad />} />
      <Route path="/eventos/:idEvento/inscripcion" element={<PaginaInscripcion />} />
      <Route
        path="/panel"
        element={
          <RutaProtegida roles={ROLES_PANEL}>
            <PaginaPanel />
          </RutaProtegida>
        }
      />
      <Route
        path="/panel/secciones"
        element={
          <RutaProtegida roles={ROLES_PANEL}>
            <PaginaPanelSecciones />
          </RutaProtegida>
        }
      />
      <Route
        path="/panel/usuarios"
        element={
          <RutaProtegida roles={['admin']}>
            <PaginaPanelUsuarios />
          </RutaProtegida>
        }
      />
      <Route
        path="/panel/eventos/:idEvento/inscritos"
        element={
          <RutaProtegida roles={ROLES_PANEL}>
            <PaginaPanelInscritos />
          </RutaProtegida>
        }
      />
      <Route
        path="/panel/agenda"
        element={
          <RutaProtegida roles={ROLES_PANEL}>
            <PaginaPanelAgenda />
          </RutaProtegida>
        }
      />
      <Route
        path="/panel/galeria"
        element={
          <RutaProtegida roles={ROLES_PANEL}>
            <PaginaPanelGaleria />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
