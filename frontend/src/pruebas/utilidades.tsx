import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import { ContextoSesion } from '../sesion/contexto'
import type { Usuario, ValorSesion } from '../sesion/tipos'

export const ADMIN: Usuario = { id: 'u-admin', nombre: 'Ana Admin', correo: 'ana@clena.test', rol: 'admin' }
export const PERSONAL: Usuario = { id: 'u-staff', nombre: 'Pedro Personal', correo: 'pedro@clena.test', rol: 'staff' }

type SesionDePrueba = Partial<Omit<ValorSesion, 'pedirConSesion'>> & {
  /** La real es genérica y un vi.fn no lo es: aquí basta cualquier función de mentira */
  pedirConSesion?: (...argumentos: never[]) => Promise<unknown>
}

interface Opciones {
  sesion?: SesionDePrueba
  /** Dirección inicial; con `ruta` se monta en esa ruta para leer sus parámetros */
  url?: string
  ruta?: string
}

/** Monta una pantalla con una sesión de mentira y el enrutador en memoria. */
export function montar(ui: ReactElement, { sesion = {}, url = '/', ruta }: Opciones = {}) {
  const valor = {
    estado: 'con-sesion',
    usuario: ADMIN,
    ingresar: vi.fn(),
    registrarse: vi.fn(),
    salir: vi.fn(),
    pedirConSesion: vi.fn(),
    ...sesion,
  } as ValorSesion
  render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={ruta ?? '*'} element={ui} />
          <Route path="/ingresar" element={<p>Pantalla de ingresar</p>} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  )
  return valor
}

/** Respuesta de fetch de mentira, con el formato de la API. */
export function respuestaApi(estado: number, cuerpo: unknown) {
  return Promise.resolve(new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } }))
}
