import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorApi } from '../api/cliente'
import { montar, PERSONAL } from '../pruebas/utilidades'
import { PaginaMiCuenta } from './PaginaMiCuenta'

const RUTA = { url: '/mi-cuenta', ruta: '/mi-cuenta' }

async function abrirYEnviar(usuario: ReturnType<typeof userEvent.setup>, { contrasena = '', confirma = false } = {}) {
  await usuario.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
  if (contrasena) await usuario.type(screen.getByLabelText('Tu contraseña'), contrasena)
  if (confirma) await usuario.click(screen.getByRole('checkbox', { name: /se borran para siempre/ }))
  await usuario.click(screen.getByRole('button', { name: 'Sí, eliminar mi cuenta' }))
}

describe('PaginaMiCuenta', () => {
  it('muestra los datos de la cuenta', () => {
    montar(<PaginaMiCuenta />, { ...RUTA, sesion: { usuario: PERSONAL } })
    expect(screen.getByText('Pedro Personal')).toBeInTheDocument()
    expect(screen.getByText('pedro@clena.test')).toBeInTheDocument()
    expect(screen.getByText('Personal del CLENA')).toBeInTheDocument()
  })

  it('sin sesión lleva a ingresar', () => {
    montar(<PaginaMiCuenta />, { ...RUTA, sesion: { estado: 'sin-sesion', usuario: null } })
    expect(screen.getByText('Pantalla de ingresar')).toBeInTheDocument()
  })

  it('sin contraseña ni confirmación no llama a la API y marca los dos campos', async () => {
    const usuario = userEvent.setup()
    const pedirConSesion = vi.fn()
    montar(<PaginaMiCuenta />, { ...RUTA, sesion: { pedirConSesion } })

    await abrirYEnviar(usuario)

    expect(pedirConSesion).not.toHaveBeenCalled()
    expect(screen.getByText('Escribe tu contraseña')).toBeInTheDocument()
    expect(screen.getByText('Marca la casilla para confirmar')).toBeInTheDocument()
  })

  it('con la contraseña equivocada marca el campo', async () => {
    const usuario = userEvent.setup()
    const pedirConSesion = vi
      .fn()
      .mockRejectedValue(new ErrorApi(422, 'CONTRASENA_INCORRECTA', 'La contraseña no es correcta'))
    montar(<PaginaMiCuenta />, { ...RUTA, sesion: { pedirConSesion } })

    await abrirYEnviar(usuario, { contrasena: 'otra', confirma: true })

    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña no es correcta')
    expect(screen.getByLabelText('Tu contraseña')).toHaveAttribute('aria-invalid', 'true')
  })

  it('al único administrador le explica por qué no puede eliminarla', async () => {
    const usuario = userEvent.setup()
    const mensaje = 'Es la única cuenta de administrador. Nombre a otra persona antes de eliminarla'
    const pedirConSesion = vi.fn().mockRejectedValue(new ErrorApi(422, 'ULTIMO_ADMINISTRADOR', mensaje))
    montar(<PaginaMiCuenta />, { ...RUTA, sesion: { pedirConSesion } })

    await abrirYEnviar(usuario, { contrasena: 'una-clave', confirma: true })

    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
  })

  it('elimina la cuenta, cierra la sesión y lo confirma', async () => {
    const usuario = userEvent.setup()
    const pedirConSesion = vi.fn().mockResolvedValue(undefined)
    const salir = vi.fn().mockResolvedValue(undefined)
    montar(<PaginaMiCuenta />, { ...RUTA, sesion: { pedirConSesion, salir } })

    await abrirYEnviar(usuario, { contrasena: 'una-clave', confirma: true })

    expect(pedirConSesion).toHaveBeenCalledWith('/cuenta', { metodo: 'DELETE', cuerpo: { contrasena: 'una-clave' } })
    expect(salir).toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: 'Tu cuenta se eliminó' })).toHaveFocus()
  })
})
