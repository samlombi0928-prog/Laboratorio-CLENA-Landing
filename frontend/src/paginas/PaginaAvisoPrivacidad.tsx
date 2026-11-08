import { useEffect } from 'react'
import { Link } from 'react-router'
import './PaginaFormulario.css'

/** Debe coincidir con PRIVACY_NOTICE_VERSION del backend. */
const VERSION_AVISO = '2026-11-provisional'

export function PaginaAvisoPrivacidad() {
  useEffect(() => {
    document.title = 'Aviso de privacidad · Recorrido CLENA'
  }, [])

  return (
    <main className="pagina-formulario">
      <article className="pagina-formulario__tarjeta pagina-formulario__tarjeta--texto">
        <Link to="/" className="pagina-formulario__volver">
          <span aria-hidden="true">←</span> Volver al inicio
        </Link>
        <h1>Aviso de privacidad</h1>
        <p className="pagina-formulario__nota">
          Texto provisional (versión {VERSION_AVISO}) mientras el CLENA aprueba el definitivo.
        </p>

        <h2>Quién trata tus datos</h2>
        <p>
          La Corporación Luis Eduardo Nieto Arteta (CLENA) trata tus datos personales según la Ley
          1581 de 2012 de protección de datos personales.
        </p>

        <h2>Qué datos guardamos y para qué</h2>
        <ul>
          <li>
            <strong>Nombre y correo:</strong> para crear tu cuenta, identificarte y enviarte la
            confirmación de tus inscripciones a eventos.
          </li>
          <li>
            <strong>Contraseña:</strong> se guarda cifrada; nadie, ni siquiera el personal del CLENA,
            puede leerla.
          </li>
          <li>
            <strong>Fecha en que aceptaste este aviso:</strong> para demostrar tu consentimiento.
          </li>
        </ul>
        <p>No pedimos más datos de los necesarios.</p>

        <h2>Tus derechos</h2>
        <p>
          Puedes conocer, actualizar y rectificar tus datos, y pedir que se eliminen. Desde tu cuenta
          podrás eliminarla junto con todos tus datos.
        </p>
      </article>
    </main>
  )
}
