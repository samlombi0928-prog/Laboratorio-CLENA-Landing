import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ErrorApi, pedir, type OpcionesPedido } from '../api/cliente'
import { ContextoSesion } from './contexto'
import type { DatosRegistro, RespuestaSesion, Usuario, ValorSesion } from './tipos'

type Estado =
  | { estado: 'cargando' }
  | { estado: 'sin-sesion' }
  | { estado: 'con-sesion'; usuario: Usuario }

/** Se renueva el token un minuto antes de que venza. */
const MARGEN_RENOVACION_MS = 60_000

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

/**
 * Guarda la sesión de la persona. El token de acceso vive solo en memoria (no
 * en localStorage); al recargar la página se recupera con la cookie httpOnly
 * del refresh token, que el navegador envía solo.
 */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Estado>({ estado: 'cargando' })
  const token = useRef<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const renovacionEnCurso = useRef<Promise<RespuestaSesion | null> | null>(null)

  const cerrarLocalmente = useCallback(() => {
    clearTimeout(temporizador.current)
    token.current = null
    setSesion({ estado: 'sin-sesion' })
  }, [])

  // Las dos funciones se llaman entre sí (al vencer el token se renueva y al
  // renovar se programa la siguiente renovación); se guardan en refs para no
  // depender del orden en que se crean.
  const aplicar = useRef<(respuesta: RespuestaSesion) => void>(() => {})
  const renovar = useRef<() => Promise<RespuestaSesion | null>>(async () => null)

  aplicar.current = (respuesta) => {
    token.current = respuesta.tokenAcceso
    setSesion({ estado: 'con-sesion', usuario: respuesta.usuario })
    clearTimeout(temporizador.current)
    const espera = Math.max(respuesta.expiraEn * 1000 - MARGEN_RENOVACION_MS, 10_000)
    temporizador.current = setTimeout(() => {
      void renovar.current().then((nueva) => (nueva ? aplicar.current(nueva) : cerrarLocalmente()))
    }, espera)
  }

  /**
   * Cambia la cookie por un token nuevo. Si ya hay una renovación en curso, se
   * espera esa misma: dos renovaciones simultáneas con la misma cookie hacen
   * que la API rechace la segunda.
   */
  renovar.current = () => {
    renovacionEnCurso.current ??= (async () => {
      try {
        return await pedir<RespuestaSesion>('/auth/renovar', { metodo: 'POST' })
      } catch (error) {
        // Otra pestaña acaba de renovar: la cookie ya cambió, se reintenta una vez.
        if (error instanceof ErrorApi && error.codigo === 'SESION_YA_RENOVADA') {
          await esperar(500)
          return await pedir<RespuestaSesion>('/auth/renovar', { metodo: 'POST' }).catch(() => null)
        }
        return null
      } finally {
        renovacionEnCurso.current = null
      }
    })()
    return renovacionEnCurso.current
  }

  // Al abrir la página se intenta recuperar la sesión
  useEffect(() => {
    void renovar.current().then((respuesta) =>
      respuesta ? aplicar.current(respuesta) : cerrarLocalmente(),
    )
    return () => clearTimeout(temporizador.current)
  }, [cerrarLocalmente])

  const ingresar = useCallback(async (correo: string, contrasena: string) => {
    const respuesta = await pedir<RespuestaSesion>('/auth/login', {
      metodo: 'POST',
      cuerpo: { correo, contrasena },
    })
    aplicar.current(respuesta)
    return respuesta.usuario
  }, [])

  const registrarse = useCallback(
    async (datos: DatosRegistro) => {
      await pedir<Usuario>('/auth/registro', { metodo: 'POST', cuerpo: datos })
      return ingresar(datos.correo, datos.contrasena)
    },
    [ingresar],
  )

  const salir = useCallback(async () => {
    try {
      await pedir('/auth/logout', { metodo: 'POST' })
    } finally {
      cerrarLocalmente()
    }
  }, [cerrarLocalmente])

  const pedirConSesion = useCallback(
    async <T,>(ruta: string, opciones: Omit<OpcionesPedido, 'token'> = {}): Promise<T> => {
      try {
        return await pedir<T>(ruta, { ...opciones, token: token.current })
      } catch (error) {
        if (!(error instanceof ErrorApi) || error.estado !== 401) throw error
        const respuesta = await renovar.current()
        if (!respuesta) {
          cerrarLocalmente()
          throw error
        }
        aplicar.current(respuesta)
        return pedir<T>(ruta, { ...opciones, token: respuesta.tokenAcceso })
      }
    },
    [cerrarLocalmente],
  )

  const valor = useMemo<ValorSesion>(
    () => ({
      estado: sesion.estado,
      usuario: sesion.estado === 'con-sesion' ? sesion.usuario : null,
      ingresar,
      registrarse,
      salir,
      pedirConSesion,
    }),
    [sesion, ingresar, registrarse, salir, pedirConSesion],
  )

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}
