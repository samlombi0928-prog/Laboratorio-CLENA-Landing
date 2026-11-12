import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { IndiceSalas } from './IndiceSalas'

const salas = [
  { id: 'corredor', nombre: 'Corredor de la Aduana' },
  { id: 'jardin', nombre: 'Jardín' },
  { id: 'cafe', nombre: 'Café de la Aduana' },
]

function montarIndice() {
  render(
    <MemoryRouter>
      <IndiceSalas salas={salas} idActual="jardin" rutaDe={(id) => `/recorrido/clena/${id}`} />
    </MemoryRouter>,
  )
}

describe('IndiceSalas', () => {
  it('abre la lista de salas con la actual marcada', async () => {
    const usuario = userEvent.setup()
    montarIndice()
    const boton = screen.getByRole('button', { name: /Salas/ })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await usuario.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByRole('link', { name: /Jardín/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Café de la Aduana' })).toHaveAttribute('href', '/recorrido/clena/cafe')
  })

  it('se cierra con Esc y devuelve el foco al botón', async () => {
    const usuario = userEvent.setup()
    montarIndice()
    await usuario.click(screen.getByRole('button', { name: /Salas/ }))

    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salas/ })).toHaveFocus()
  })
})
