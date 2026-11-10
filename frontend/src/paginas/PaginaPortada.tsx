import { useEffect } from 'react'
import { Link } from 'react-router'
import { BarraSesion } from '../componentes/BarraSesion'
import './PaginaPortada.css'

export function PaginaPortada() {
  useEffect(() => {
    document.title = 'Recorrido CLENA'
  }, [])

  return (
    <main className="portada">
      <BarraSesion />
      <div className="portada__contenido">
        <p className="portada__lugar">Corporación Luis Eduardo Nieto Arteta · Barranquilla</p>
        <h1 className="portada__titulo">Recorre el CLENA</h1>
        <p className="portada__frase">
          Explora la antigua Aduana de Barranquilla sala por sala y descubre su historia mientras
          caminas.
        </p>
        <Link to="/recorrido/clena" className="portada__boton">
          Iniciar recorrido <span aria-hidden="true">➜</span>
        </Link>
        <p className="portada__ayuda">
          Arrastra para mirar alrededor y usa los botones dentro de cada sala para pasar a la
          siguiente.
        </p>
      </div>
    </main>
  )
}
