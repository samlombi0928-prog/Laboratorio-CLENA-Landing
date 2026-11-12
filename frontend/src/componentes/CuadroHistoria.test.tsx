import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CuadroHistoria } from './CuadroHistoria'

const fragmentos = [
  { titulo: 'El Archivo Histórico', texto: 'Aquí se conservan documentos.' },
  { titulo: '¿Cómo se consulta?', texto: 'Se pide en el mostrador.', epoca: 'Hoy' },
]

describe('CuadroHistoria', () => {
  it('avanza y retrocede entre las partes de la historia', async () => {
    const usuario = userEvent.setup()
    render(<CuadroHistoria fragmentos={fragmentos} minimizado={false} onMinimizar={vi.fn()} />)

    expect(screen.getByText('1 de 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'El Archivo Histórico' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()

    await usuario.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText('2 de 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '¿Cómo se consulta?' })).toBeInTheDocument()
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()

    await usuario.click(screen.getByRole('button', { name: /Anterior/ }))
    expect(screen.getByText('1 de 2')).toBeInTheDocument()
  })

  it('el texto nuevo se anuncia a los lectores de pantalla', () => {
    render(<CuadroHistoria fragmentos={fragmentos} minimizado={false} onMinimizar={vi.fn()} />)
    expect(screen.getByText('Aquí se conservan documentos.').closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })

  it('se minimiza y se vuelve a abrir', async () => {
    const usuario = userEvent.setup()
    const onMinimizar = vi.fn()
    const { rerender } = render(<CuadroHistoria fragmentos={fragmentos} minimizado={false} onMinimizar={onMinimizar} />)

    await usuario.click(screen.getByRole('button', { name: 'Minimizar la historia' }))
    expect(onMinimizar).toHaveBeenCalledWith(true)

    rerender(<CuadroHistoria fragmentos={fragmentos} minimizado onMinimizar={onMinimizar} />)
    await usuario.click(screen.getByRole('button', { name: /Historia de esta sala/ }))
    expect(onMinimizar).toHaveBeenCalledWith(false)
  })

  it('sin historia no muestra nada', () => {
    const { container } = render(<CuadroHistoria fragmentos={[]} minimizado={false} onMinimizar={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
