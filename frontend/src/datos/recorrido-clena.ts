import type { Conexion, Escena, FragmentoHistoria, PuntoInteres } from '../tipos/escena'

// Datos temporales: se reemplazan por la API de recorridos cuando esté lista.
// Las fotos de la cámara Kodak (gran angular) están enderezadas al formato del visor
// y cubren unos 100° de ancho; las del museo son fotos normales.
// Las conexiones entre salas y la posición de cada punto son provisionales. Los textos de
// historia los revisó el equipo de Introducción el 12 de noviembre de 2026.

/** Escena tomada con la cámara Kodak y enderezada: cubre unos 100° de ancho. */
function kodak(
  id: string,
  nombre: string,
  descripcion: string,
  conexiones: Conexion[],
  historia: FragmentoHistoria[],
  anguloHorizontal = 100,
): Escena {
  return {
    id,
    nombre,
    imagen: `/escenas/${id}.jpg`,
    descripcion,
    tipo: 'parcial',
    anguloHorizontal,
    conexiones,
    historia,
  }
}

// Objetos destacados por sala. Los textos son provisionales, como los de la historia:
// solo describen lo que se ve en la foto hasta que el equipo de Introducción entregue los suyos.
const puntosInteres: Record<string, PuntoInteres[]> = {
  corredor: [
    {
      id: 'cartelera',
      titulo: 'Cartelera cultural',
      texto:
        'Aquí se anuncian las exposiciones, los talleres y los eventos del mes en el CLENA.',
      yaw: -34,
      pitch: 6,
    },
  ],
  'biblioteca-meira': [
    {
      id: 'letrero-meira',
      titulo: 'Sala de lectura Meira del Mar',
      texto:
        'La sala lleva el nombre de Meira del Mar, poeta barranquillera, en honor a su inmenso legado cultural e histórico.',
      yaw: -32,
      pitch: 17,
    },
  ],
  'exposiciones-frente': [
    {
      id: 'mural-heins',
      titulo: 'Rosario Heins: La permanencia del talento',
      texto:
        'Es el título de la exposición. Debajo está su obra principal: un mural con escenas de playa, rodeado de cuadros de la misma serie.',
      yaw: 0,
      pitch: -6,
    },
  ],
}

const escenasSinPuntos: Escena[] = [
  // Afuera
  kodak(
    'corredor',
    'Corredor de la Aduana',
    'Corredor exterior con paredes amarillas, piso de ladrillo, una cartelera con la oferta cultural y una puerta de madera al fondo. A la derecha hay un jardín con palmas.',
    [
      { destino: 'entrada', yaw: 0, pitch: 8 },
      { destino: 'jardin', yaw: 35, pitch: -5 },
    ],
    [
      {
        titulo: 'Bienvenido al CLENA',
        texto:
          'Estás en el complejo de la antigua Aduana de Barranquilla, sede de la Corporación Luis Eduardo Nieto Arteta. Entra por la puerta principal y descubre lo que ofrece este interesante lugar. ¡Recorramos sus espacios!',
      },
      {
        titulo: 'La oferta cultural',
        texto:
          'En la cartelera de la izquierda se publican las actividades del mes: exposiciones, talleres y eventos abiertos al público.',
      },
    ],
  ),
  kodak(
    'jardin',
    'Jardín',
    'Jardín con piedras blancas, plantas y un letrero informativo frente a una pared amarilla.',
    [{ destino: 'corredor', yaw: -35, pitch: -10 }],
    [
      {
        titulo: 'Los jardines',
        texto:
          'Las zonas verdes rodean los edificios del complejo. Además, aquí está una iniciativa de arte público: las «vacasquillas».',
      },
    ],
  ),
  kodak(
    'entrada',
    'Entrada principal',
    'Fachada amarilla con una puerta verde abierta al centro, ventanas de madera a los lados y matas en la entrada.',
    [
      { destino: 'biblioteca-entrada', yaw: -30, pitch: 5 },
      { destino: 'exposiciones-sala', yaw: 30, pitch: 5 },
      { destino: 'museo', yaw: 0, pitch: -6 },
      { destino: 'archivo', yaw: -30, pitch: -15 },
      { destino: 'cafe-entrada', yaw: 30, pitch: -15 },
      { destino: 'corredor', yaw: 0, pitch: -36 },
    ],
    [
      {
        titulo: 'La entrada',
        texto:
          'Desde aquí puedes ir a la Biblioteca, la Sala de exposiciones, el Museo, el Archivo Histórico y el Café.',
      },
    ],
  ),

  // Biblioteca
  kodak(
    'biblioteca-entrada',
    'Biblioteca',
    'Pasillo central de la biblioteca con piso de baldosas decoradas, techo con molduras doradas y salas con rejas de madera a ambos lados.',
    [
      { destino: 'biblioteca-meira', yaw: 0, pitch: -2 },
      { destino: 'biblioteca-coleccion', yaw: 35, pitch: -8 },
      { destino: 'biblioteca-baranda', yaw: -35, pitch: -18 },
    ],
    [
      {
        titulo: 'La Biblioteca',
        texto:
          'Un pasillo central reúne las salas de la biblioteca. A la derecha está la Colección general y al fondo, la Sala de lectura Meira del Mar.',
      },
      {
        titulo: 'Históricamente',
        texto:
          'El edificio era conocido como el epicentro del comercio exterior de Barranquilla: aquí se gestionaban las importaciones y exportaciones.',
      },
    ],
  ),
  kodak(
    'biblioteca-baranda',
    'Biblioteca: escalera de entrada',
    'Vista desde la baranda blanca sobre la escalera de entrada, con columnas y salas de la biblioteca alrededor.',
    [
      { destino: 'biblioteca-entrada', yaw: -35, pitch: -25 },
      { destino: 'entrada', yaw: 0, pitch: -12 },
    ],
    [
      {
        titulo: 'La escalera',
        texto: 'Por esta escalera se sube a la biblioteca. Los carteles indican la entrada y la salida.',
      },
    ],
  ),
  kodak(
    'biblioteca-coleccion',
    'Biblioteca: Colección general',
    'Sala con estanterías de libros, columnas blancas y una mesa de consulta con vitrinas.',
    [{ destino: 'biblioteca-entrada', yaw: 40, pitch: -15 }],
    [
      {
        titulo: 'La Colección general',
        texto: 'Estanterías con libros de consulta y mesas para leer, abiertas al público.',
      },
    ],
  ),
  kodak(
    'biblioteca-meira',
    'Biblioteca: Sala de lectura Meira del Mar',
    'Pasillo de la biblioteca frente a la Sala de lectura Meira del Mar, con puertas de madera y techo decorado.',
    [
      { destino: 'infantil-entrada', yaw: 0, pitch: -2 },
      { destino: 'biblioteca-sala', yaw: -30, pitch: -8 },
      { destino: 'biblioteca-entrada', yaw: 0, pitch: -35 },
    ],
    [
      {
        titulo: 'Sala de lectura Meira del Mar',
        texto: 'A la izquierda está la sala de lectura, con mesas para leer y estudiar en silencio.',
      },
    ],
  ),
  kodak(
    'biblioteca-sala',
    'Biblioteca: sala de lectura',
    'Sala amplia con columnas blancas, mesas, sillas y estanterías de libros, con ventanales al fondo.',
    [
      { destino: 'biblioteca-estanterias', yaw: 25, pitch: -5 },
      { destino: 'biblioteca-meira', yaw: -40, pitch: -15 },
    ],
    [
      {
        titulo: 'Un lugar para leer',
        texto: 'Las mesas de esta sala están abiertas a cualquier visitante que quiera leer o estudiar.',
      },
    ],
  ),
  kodak(
    'biblioteca-estanterias',
    'Biblioteca: estanterías',
    'Pasillo estrecho entre dos estanterías altas llenas de libros.',
    [{ destino: 'biblioteca-sala', yaw: 0, pitch: -35 }],
    [
      {
        titulo: 'Entre los libros',
        texto:
          'Los libros están organizados por temas en estas estanterías. La colección cuenta con literatura regional e historia de Barranquilla y del Caribe colombiano.',
      },
    ],
  ),

  // Sala infantil
  kodak(
    'infantil-entrada',
    'Sala infantil: entrada',
    'Puerta de madera al final del pasillo de la biblioteca que da a una sala con un mural azul.',
    [
      { destino: 'infantil', yaw: 0, pitch: -5 },
      { destino: 'biblioteca-meira', yaw: 0, pitch: -38 },
    ],
    [
      {
        titulo: 'La sala infantil',
        texto: 'Al final del pasillo está la sala para niñas y niños, con su propio mural.',
      },
    ],
  ),
  kodak(
    'infantil',
    'Sala infantil',
    'Sala con un gran mural azul de niños, mariposas y la luna, filas de sillas blancas y mesas rojas.',
    [
      { destino: 'infantil-mesas', yaw: 35, pitch: -10 },
      { destino: 'infantil-entrada', yaw: -40, pitch: -20 },
    ],
    [
      {
        titulo: 'El mural',
        texto: 'El mural llena de color la sala donde se leen cuentos y se hacen actividades para niños.',
      },
    ],
  ),
  kodak(
    'infantil-mesas',
    'Sala infantil: mesas',
    'Mesas rojas con computadores y sillas verdes junto al mural azul.',
    [{ destino: 'infantil', yaw: -35, pitch: -15 }],
    [
      {
        titulo: 'Para estudiar y jugar',
        texto: 'Las mesas tienen computadores para las niñas y los niños que visitan la sala.',
      },
    ],
  ),

  // Sala de exposiciones
  kodak(
    'exposiciones-sala',
    'Sala de exposiciones',
    'Sala amplia de paredes blancas con cuadros colgados, techo con vigas y lámparas, y piso de baldosas en damero.',
    [
      { destino: 'exposiciones-frente', yaw: 40, pitch: -5 },
      { destino: 'exposiciones-entrada', yaw: -42, pitch: -10 },
    ],
    [
      {
        titulo: 'La Sala de exposiciones',
        texto: 'Una sala amplia para exposiciones de arte que cambian durante el año.',
      },
      {
        titulo: 'Rosario Heins: La permanencia del talento',
        texto:
          'Cuando se tomó esta foto se exhibía esta muestra, que celebra los 50 años de creación plástica de la artista.',
      },
    ],
  ),
  kodak(
    'exposiciones-frente',
    'Sala de exposiciones: obra principal',
    'Pared del fondo de la sala con el título de la exposición de Rosario Heins y un mural de escenas de playa, con cuadros a los lados.',
    [{ destino: 'exposiciones-sala', yaw: 0, pitch: -35 }],
    [
      {
        titulo: 'Escenas de playa',
        texto:
          'Las obras de esta muestra retratan días de playa en el Caribe colombiano, dibujados con lápices de colores.',
      },
    ],
  ),
  kodak(
    'exposiciones-entrada',
    'Sala de exposiciones: entrada',
    'Pared con el texto de presentación de la exposición, cuadros pequeños a la izquierda y una puerta de madera abierta a la derecha.',
    [
      { destino: 'entrada', yaw: 30, pitch: -8 },
      { destino: 'exposiciones-sala', yaw: -40, pitch: -15 },
    ],
    [
      {
        titulo: 'La presentación de la muestra',
        texto:
          'Cada exposición tiene a la entrada un texto que cuenta quién es el artista y qué vas a ver. Por la puerta de la derecha se sale de la sala.',
      },
    ],
    132,
  ),

  // Archivo y café
  kodak(
    'archivo',
    'Archivo Histórico',
    'Sala de trabajo del Archivo Histórico con un mostrador de atención, columnas, estantes con cajas de documentos y piso de baldosas en damero.',
    [{ destino: 'entrada', yaw: -35, pitch: -30 }],
    [
      {
        titulo: 'El Archivo Histórico',
        texto: 'En esta sala se conservan y se consultan documentos sobre la historia de la región.',
      },
      {
        titulo: '¿Cómo se consulta?',
        texto:
          'Los investigadores y visitantes hacen su solicitud en el mostrador y revisan el material en las mesas de consulta.',
      },
    ],
  ),
  kodak(
    'cafe-entrada',
    'Café de la Aduana: entrada',
    'Entrada al Café de la Aduana, con mesas al fondo y dos placas conmemorativas en la pared de la izquierda.',
    [
      { destino: 'cafe', yaw: 0, pitch: -10 },
      { destino: 'entrada', yaw: 0, pitch: -38 },
    ],
    [
      {
        titulo: 'El Café de la Aduana',
        texto:
          'Un espacio para tomar algo durante la visita. En la pared de la izquierda hay placas conmemorativas del edificio.',
      },
    ],
  ),
  kodak(
    'cafe',
    'Café de la Aduana',
    'Café con mesas blancas, sillas de madera, una lámpara colgante con varios bombillos y una barra junto a la pared.',
    [{ destino: 'cafe-entrada', yaw: -20, pitch: 5 }],
    [
      {
        titulo: 'Un descanso',
        texto:
          'Mesas para sentarse a conversar o descansar antes de seguir el recorrido. En el apartado de la izquierda puedes conocer más sobre el CLENA.',
      },
    ],
  ),

  // Museo (fotos anteriores: no se pudieron tomar nuevas por un evento)
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
      { destino: 'entrada', yaw: -26, pitch: -14 },
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
          'Puedes explorar esta sala, donde se recuerda el papel fundamental que tuvo el comercio en el crecimiento de Barranquilla. Lee la cita en la pared.',
      },
    ],
  },
]

export const escenasClena: Escena[] = escenasSinPuntos.map((escena) => ({
  ...escena,
  puntosInteres: puntosInteres[escena.id] ?? [],
}))
