import type { Escena } from '../tipos/escena'

// Datos temporales: se reemplazan por la API de recorridos cuando esté lista,
// y las fotos por las panorámicas 360° de la cámara Kodak.
// Las conexiones entre salas, la posición de cada punto y los textos de historia son
// provisionales: los textos definitivos los entrega el equipo de Introducción.
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
    historia: [
      {
        titulo: 'Bienvenido al CLENA',
        texto:
          'Estás en el complejo de la antigua Aduana de Barranquilla, sede de la Corporación Luis Eduardo Nieto Arteta. Desde este pasillo puedes ir al Museo, al Archivo Histórico y a la Biblioteca.',
      },
      {
        titulo: 'Un edificio con historia',
        texto:
          'Por estos pasillos pasaron durante décadas los registros del comercio que entraba y salía de la ciudad. Fíjate en las baldosas del piso y en las molduras del techo.',
      },
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
    historia: [
      {
        titulo: 'El Museo de la Aduana',
        texto:
          'Esta sala presenta la historia de Barranquilla y de su relación con el río y el comercio.',
      },
      {
        titulo: 'Este territorio que somos',
        texto:
          'El mapa iluminado muestra los municipios del Atlántico. Cada punto recuerda un lugar con su propia historia.',
      },
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
    historia: [
      {
        titulo: 'La sala de proyección',
        texto:
          'Aquí se proyectan imágenes del edificio de la Aduana y de la ciudad. El muro de la derecha reúne fotografías históricas.',
      },
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
    historia: [
      {
        titulo: 'La Cámara de Comercio',
        texto:
          'Esta sala recuerda el papel del comercio en el crecimiento de Barranquilla. Lee la cita en la pared de la derecha.',
      },
    ],
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
    historia: [
      {
        titulo: 'El Archivo Histórico',
        texto:
          'En esta sala se conservan y se consultan documentos sobre la historia de la región.',
      },
      {
        titulo: '¿Cómo se consulta?',
        texto:
          'Los investigadores y visitantes hacen su solicitud en el mostrador y revisan el material en las mesas de consulta.',
      },
    ],
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
    historia: [
      {
        titulo: 'La Biblioteca',
        texto:
          'Un espacio de lectura y estudio abierto al público, con colecciones de libros y computadores para consultar.',
      },
    ],
  },
]
