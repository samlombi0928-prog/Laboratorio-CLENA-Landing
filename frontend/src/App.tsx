import { Navigate, Route, Routes } from 'react-router'
import { PaginaPortada } from './paginas/PaginaPortada'
import { PaginaRecorrido } from './paginas/PaginaRecorrido'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PaginaPortada />} />
      <Route path="/recorrido/clena/:escenaId?" element={<PaginaRecorrido />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
