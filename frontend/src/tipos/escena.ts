/**
 * '360': foto panorámica completa (equirectangular 2:1), como las de la cámara Kodak.
 * 'parcial': foto normal; el visor solo deja girar dentro del ángulo que cubre.
 */
export type TipoFoto = '360' | 'parcial'

/** Punto dentro de una escena que lleva a otra */
export interface Conexion {
  /** id de la escena de destino */
  destino: string
  /** Ángulo horizontal en grados: 0 es el centro, negativo a la izquierda */
  yaw: number
  /** Ángulo vertical en grados: 0 es el horizonte, negativo hacia abajo */
  pitch: number
}

/** Parte de la historia de una sala que se muestra en el cuadro inferior izquierdo */
export interface FragmentoHistoria {
  titulo: string
  texto: string
  /** Fecha o época a la que se refiere, por ejemplo "1921" o "Siglo XX" */
  epoca?: string
}

export interface Escena {
  id: string
  nombre: string
  /** Ruta de la imagen dentro de public/ */
  imagen: string
  /** Descripción en texto de lo que se ve, para lectores de pantalla */
  descripcion: string
  tipo: TipoFoto
  /** Solo fotos parciales: ángulo horizontal aproximado que cubre la foto, en grados */
  anguloHorizontal?: number
  /** Solo fotos 360°: cuánto puede bajar la vista, en grados (negativo = bajo el horizonte) */
  inclinacionMinima?: number
  conexiones: Conexion[]
  historia: FragmentoHistoria[]
}
