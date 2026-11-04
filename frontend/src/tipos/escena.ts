/**
 * '360': foto panorámica completa (equirectangular 2:1), como las de la cámara Kodak.
 * 'parcial': foto normal; el visor solo deja girar dentro del ángulo que cubre.
 */
export type TipoFoto = '360' | 'parcial'

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
}
