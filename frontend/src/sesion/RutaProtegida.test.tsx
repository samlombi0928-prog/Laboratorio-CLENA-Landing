import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ADMIN, montar, PERSONAL } from '../pruebas/utilidades'
import { RutaProtegida } from './RutaProtegida'
import { ROLES_PANEL } from './tipos'

const contenido = <p>Contenido privado</p>

describe('RutaProtegida', () => {
  it('muestra un aviso mientras recupera la sesión', () => {
    montar(<RutaProtegida>{contenido}</RutaProtegida>, { sesion: { estado: 'cargando', usuario: null } })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('sin sesión lleva a ingresar', () => {
    montar(<RutaProtegida>{contenido}</RutaProtegida>, {
      sesion: { estado: 'sin-sesion', usuario: null },
      url: '/panel/usuarios',
    })
    expect(screen.getByText('Pantalla de ingresar')).toBeInTheDocument()
  })

  it('con el rol permitido muestra el contenido', () => {
    montar(<RutaProtegida roles={ROLES_PANEL}>{contenido}</RutaProtegida>, { sesion: { usuario: PERSONAL } })
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })

  it('al personal no lo deja entrar a lo que es solo del administrador', () => {
    montar(<RutaProtegida roles={['admin']}>{contenido}</RutaProtegida>, { sesion: { usuario: PERSONAL } })
    expect(screen.getByRole('heading', { name: 'No tienes permiso para ver esta página' })).toBeInTheDocument()
    expect(screen.getByText('Esta sección es solo para administradores.')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('al usuario público no lo deja entrar al panel', () => {
    montar(<RutaProtegida roles={ROLES_PANEL}>{contenido}</RutaProtegida>, {
      sesion: { usuario: { ...ADMIN, rol: 'public' } },
    })
    expect(screen.getByText('Esta sección es solo para el personal del CLENA.')).toBeInTheDocument()
  })
})
