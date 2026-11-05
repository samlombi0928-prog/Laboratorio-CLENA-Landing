import type { Escena } from '../tipos/escena'

// Datos temporales: se reemplazan por la API de recorridos cuando esté lista,
// y las fotos por las panorámicas 360° de la cámara Kodak.
// Las conexiones entre salas y la posición de cada punto son provisionales.
export const escenasClena: Escena[] = [
  {
    id: 'pasillo',
    nombre: 'Pasillo de la Aduana',
    imagen: '/escenas/pasillo.jpg',
    descripcion:
      'Pasillo largo con piso de baldosas decoradas, techo con molduras y lámparas, y ventanas con rejas a ambos lados.',
    tipo: 'parcial',
    anguloHorizontal: 65,
    conexiones: [
      { destino: 'museo', yaw: 0, pitch: -4 },
      { destino: 'archivo', yaw: -20, pitch: -14 },
      { destino: 'biblioteca', yaw: 20, pitch: -14 },
    ],
  },
  {
    id: 'museo',
    nombre: 'Museo de la Aduana',
    imagen: '/escenas/museo-1.jpg',
    descripcion:
      'Sala del museo con piso de baldosas en damero, una pantalla con la palabra Barranquilla, paneles con fotografías y un mapa iluminado en la pared.',
    tipo: 'parcial',
    anguloHorizontal: 75,
    conexiones: [
      { destino: 'museo-proyeccion', yaw: -3, pitch: -4 },
      { destino: 'pasillo', yaw: -26, pitch: -14 },
    ],
  },
  {
    id: 'museo-proyeccion',
    nombre: 'Museo: sala de proyección',
    imagen: '/escenas/museo-2.jpg',
    descripcion:
      'Sala oscura del museo con una proyección del edificio de la Aduana y un muro con fotografías históricas.',
    tipo: 'parcial',
    anguloHorizontal: 70,
    conexiones: [
      { destino: 'museo', yaw: -24, pitch: -14 },
      { destino: 'museo-camara-comercio', yaw: 24, pitch: -14 },
    ],
  },
  {
    id: 'museo-camara-comercio',
    nombre: 'Museo: Cámara de Comercio',
    imagen: '/escenas/museo-3.jpg',
    descripcion:
      'Sala del museo con proyecciones de pinturas y del edificio de la Aduana, y una cita sobre la Cámara de Comercio de Barranquilla en la pared.',
    tipo: 'parcial',
    anguloHorizontal: 70,
    conexiones: [{ destino: 'museo-proyeccion', yaw: -24, pitch: -14 }],
  },
  {
    id: 'archivo',
    nombre: 'Archivo Histórico',
    imagen: '/escenas/archivo.jpg',
    descripcion:
      'Sala del Archivo Histórico con columnas blancas, un mostrador de atención, estantes con documentos y mesas de consulta.',
    tipo: 'parcial',
    anguloHorizontal: 75,
    conexiones: [{ destino: 'pasillo', yaw: -26, pitch: -14 }],
  },
  {
    id: 'biblioteca',
    nombre: 'Biblioteca',
    imagen: '/escenas/biblioteca.jpg',
    descripcion:
      'Biblioteca con estanterías de libros, mesas de lectura con computadores y techos altos con ventanales de madera.',
    tipo: 'parcial',
    anguloHorizontal: 75,
    conexiones: [{ destino: 'pasillo', yaw: -26, pitch: -14 }],
  },
]
