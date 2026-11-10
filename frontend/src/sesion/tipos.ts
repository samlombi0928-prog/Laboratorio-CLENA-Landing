import type { OpcionesPedido } from '../api/cliente'

export type Rol = 'admin' | 'staff' | 'public'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
}

/** Lo que devuelve la API al iniciar o renovar la sesión. */
export interface RespuestaSesion {
  tokenAcceso: string
  /** Segundos que dura el token de acceso */
  expiraEn: number
  usuario: Usuario
}

export interface DatosRegistro {
  nombre: string
  correo: string
  contrasena: string
  aceptaPrivacidad: boolean
}

export interface ValorSesion {
  /** 'cargando' mientras se intenta recuperar la sesión al abrir la página */
  estado: 'cargando' | 'sin-sesion' | 'con-sesion'
  usuario: Usuario | null
  ingresar: (correo: string, contrasena: string) => Promise<Usuario>
  registrarse: (datos: DatosRegistro) => Promise<Usuario>
  salir: () => Promise<void>
  /** Pide a la API con el token de acceso; si venció, renueva la sesión y reintenta una vez. */
  pedirConSesion: <T>(ruta: string, opciones?: Omit<OpcionesPedido, 'token'>) => Promise<T>
}

/** Roles que pueden entrar al panel de administración. */
export const ROLES_PANEL: Rol[] = ['staff', 'admin']

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: 'Administrador',
  staff: 'Personal del CLENA',
  public: 'Usuario público',
}
