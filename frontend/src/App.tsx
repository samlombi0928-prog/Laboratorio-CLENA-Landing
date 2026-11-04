import { Navigate, Route, Routes } from 'react-router'
import { PaginaRecorrido } from './paginas/PaginaRecorrido'

function App() {
  return (
    <Routes>
      <Route path="/recorrido/clena/:escenaId?" element={<PaginaRecorrido />} />
      {/* Mientras no exista la portada (HU-01), la raíz lleva directo al recorrido */}
      <Route path="*" element={<Navigate to="/recorrido/clena" replace />} />
    </Routes>
  )
}

export default App
