import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorApi } from '../api/cliente'
import { montar } from '../pruebas/utilidades'
import type { Usuario } from '../sesion/tipos'
import { PaginaPanelUsuarios } from './PaginaPanelUsuarios'

const usuarios: Usuario[] = [
  { id: '1', nombre: 'Ana Admin', correo: 'ana@clena.test', rol: 'admin' },
  { id: '2', nombre: 'Luis Gómez', correo: 'luis@clena.test', rol: 'public' },
  { id: '3', nombre: 'María Ríos', correo: 'maria@clena.test', rol: 'staff' },
]

const pagina = (datos: Usuario[]) => ({ datos, pagina: 1, porPagina: 10, total: datos.length, totalPaginas: 1 })

/** API de mentira: GET devuelve la lista y PATCH responde bien. */
function apiConUsuarios() {
  return vi.fn(async (_ruta: string, opciones?: { metodo?: string }) => (opciones?.metodo === 'PATCH' ? {} : pagina(usuarios)))
}

const fichaDe = async (nombre: string) => (await screen.findByRole('heading', { name: nombre })).closest('li') as HTMLElement

describe('PaginaPanelUsuarios', () => {
  it('nombra personal del CLENA a un usuario público', async () => {
    const usuario = userEvent.setup()
    const pedirConSesion = apiConUsuarios()
    montar(<PaginaPanelUsuarios />, { sesion: { pedirConSesion } })

    await usuario.click(within(await fichaDe('Luis Gómez')).getByRole('button', { name: 'Nombrar personal a Luis Gómez' }))

    expect(pedirConSesion).toHaveBeenCalledWith('/usuarios/2/rol', { metodo: 'PATCH', cuerpo: { rol: 'staff' } })
    expect(await screen.findByRole('status')).toHaveTextContent('Luis Gómez ahora es personal del CLENA')
  })

  it('pide confirmación antes de quitar el rol, y si se cancela no cambia nada', async () => {
    const usuario = userEvent.setup()
    const pedirConSesion = apiConUsuarios()
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    montar(<PaginaPanelUsuarios />, { sesion: { pedirConSesion } })

    await usuario.click(within(await fichaDe('María Ríos')).getByRole('button', { name: /Quitar rol/ }))

    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining('María Ríos'))
    expect(pedirConSesion).not.toHaveBeenCalledWith(expect.stringContaining('/rol'), expect.anything())
  })

  it('al administrador no se le puede cambiar el rol', async () => {
    montar(<PaginaPanelUsuarios />, { sesion: { pedirConSesion: apiConUsuarios() } })
    const ficha = await fichaDe('Ana Admin')
    expect(within(ficha).queryByRole('button')).not.toBeInTheDocument()
    expect(within(ficha).getByText('El rol de administrador no se cambia desde aquí.')).toBeInTheDocument()
  })

  it('busca y filtra por rol con los parámetros de la API', async () => {
    const usuario = userEvent.setup()
    const pedirConSesion = apiConUsuarios()
    montar(<PaginaPanelUsuarios />, { sesion: { pedirConSesion } })

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o correo' }), 'luis{Enter}')
    await usuario.click(screen.getByRole('button', { name: 'Personal del CLENA' }))

    expect(pedirConSesion).toHaveBeenLastCalledWith('/usuarios?buscar=luis&rol=staff&pagina=1&porPagina=10')
    expect(screen.getByRole('button', { name: 'Personal del CLENA' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('muestra el error de la API si no puede cargar la lista', async () => {
    const pedirConSesion = vi.fn().mockRejectedValue(new ErrorApi(500, 'ERROR', 'El servidor no responde'))
    montar(<PaginaPanelUsuarios />, { sesion: { pedirConSesion } })
    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no responde')
  })
})
