import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PanelPuntoInteres } from './PanelPuntoInteres'

const punto = { id: 'mural', titulo: 'Mural de Rosario Heins', texto: 'Obra principal de la muestra.', yaw: 0, pitch: 0 }

describe('PanelPuntoInteres', () => {
  it('muestra el objeto con su título como nombre del diálogo', () => {
    render(<PanelPuntoInteres punto={punto} onCerrar={vi.fn()} />)
    const dialogo = screen.getByRole('dialog', { name: 'Mural de Rosario Heins' })
    expect(dialogo).toHaveAttribute('open')
    expect(dialogo).toHaveAccessibleDescription('Obra principal de la muestra.')
  })

  it('se cierra con el botón', async () => {
    const usuario = userEvent.setup()
    const onCerrar = vi.fn()
    render(<PanelPuntoInteres punto={punto} onCerrar={onCerrar} />)
    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onCerrar).toHaveBeenCalled()
  })

  it('se cierra con Esc', () => {
    const onCerrar = vi.fn()
    render(<PanelPuntoInteres punto={punto} onCerrar={onCerrar} />)
    // El navegador avisa Esc en un <dialog> con el evento cancel
    fireEvent(screen.getByRole('dialog'), new Event('cancel'))
    expect(onCerrar).toHaveBeenCalled()
  })

  it('sin objeto el panel queda cerrado', () => {
    render(<PanelPuntoInteres punto={null} onCerrar={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
