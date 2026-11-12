import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { montar, respuestaApi } from '../pruebas/utilidades'
import { PaginaInscripcion } from './PaginaInscripcion'

const URL_EVENTO = '/eventos/evento-1/inscripcion'

function montarInscripcion() {
  montar(<PaginaInscripcion />, { url: URL_EVENTO, ruta: '/eventos/:idEvento/inscripcion' })
}

async function llenar(usuario: ReturnType<typeof userEvent.setup>, { acepta = true } = {}) {
  await usuario.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Ana Pérez')
  await usuario.type(screen.getByRole('textbox', { name: 'Correo' }), 'ana@clena.test')
  if (acepta) await usuario.click(screen.getByRole('checkbox', { name: 'Leí y acepto el aviso de privacidad' }))
  await usuario.click(screen.getByRole('button', { name: 'Inscribirme' }))
}

describe('PaginaInscripcion', () => {
  it('sin aceptar el aviso no envía nada y lo explica', async () => {
    const usuario = userEvent.setup()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    montarInscripcion()

    await llenar(usuario, { acepta: false })

    expect(fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Para inscribirte debes aceptar el aviso de privacidad.')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('inscribe sin cuenta y confirma el evento y el correo', async () => {
    const usuario = userEvent.setup()
    const fetch = vi.fn(() =>
      respuestaApi(201, {
        id: 'i-1',
        eventoId: 'evento-1',
        eventoTitulo: 'Noche de jazz en la Aduana',
        nombre: 'Ana Pérez',
        correo: 'ana@clena.test',
        creadoEn: '2026-11-12T00:00:00.000Z',
        correoEnviado: true,
      }),
    )
    vi.stubGlobal('fetch', fetch)
    montarInscripcion()

    await llenar(usuario)

    expect(fetch).toHaveBeenCalledWith('/api/v1/eventos/evento-1/inscripciones', expect.objectContaining({ method: 'POST' }))
    const titulo = await screen.findByRole('heading', { name: '¡Inscripción lista!' })
    expect(titulo).toHaveFocus()
    expect(screen.getByText('Noche de jazz en la Aduana')).toBeInTheDocument()
    expect(screen.getByText('ana@clena.test')).toBeInTheDocument()
  })

  it('si el correo de confirmación no sale, avisa que la inscripción igual quedó', async () => {
    const usuario = userEvent.setup()
    vi.stubGlobal('fetch', () =>
      respuestaApi(201, { eventoTitulo: 'Feria del libro', nombre: 'Ana Pérez', correo: 'ana@clena.test', correoEnviado: false }),
    )
    montarInscripcion()

    await llenar(usuario)

    expect(await screen.findByText(/no pudimos enviarte el correo de confirmación/)).toBeInTheDocument()
  })

  it('con el evento lleno muestra el mensaje de la API', async () => {
    const usuario = userEvent.setup()
    vi.stubGlobal('fetch', () =>
      respuestaApi(409, { estado: 409, codigo: 'EVENTO_SIN_CUPOS', mensaje: 'El evento ya no tiene cupos disponibles' }),
    )
    montarInscripcion()

    await llenar(usuario)

    expect(await screen.findByRole('alert')).toHaveTextContent('El evento ya no tiene cupos disponibles')
  })

  it('si el evento no existe o no está publicado, lo dice sin mostrar el id', async () => {
    const usuario = userEvent.setup()
    vi.stubGlobal('fetch', () =>
      respuestaApi(404, { estado: 404, codigo: 'RECURSO_NO_ENCONTRADO', mensaje: 'Evento con id evento-1 no existe' }),
    )
    montarInscripcion()

    await llenar(usuario)

    expect(await screen.findByRole('alert')).toHaveTextContent('Este evento no existe o ya no recibe inscripciones.')
  })
})
