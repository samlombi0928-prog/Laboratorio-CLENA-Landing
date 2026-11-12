/**
 * Imágenes de ejemplo de la galería para la demo (#47, #48).
 *
 * Son fotos del recorrido (frontend/public), que el equipo de origen autorizó
 * a usar y en las que no se reconoce a ninguna persona. Los archivos están en
 * backend/seed/galeria y los copia `npm run galeria:semilla`.
 *
 * Los textos alternativos describen solo lo que se ve en cada foto.
 */
export interface GallerySeedImage {
  /** Id de la fila. Fijo, para que correr la semilla dos veces no duplique nada. */
  id: string;
  /** Archivo dentro de backend/seed/galeria. */
  file: string;
  /** Clave en el almacenamiento: gallery/<uuid>.jpg. También fija. */
  key: string;
  title: string;
  altText: string;
}

export const GALLERY_SEED_IMAGES: GallerySeedImage[] = [
  {
    id: '6a1e0001-0000-4000-8000-000000000001',
    file: 'fachada.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000001.jpg',
    title: 'Entrada principal del complejo',
    altText:
      'Fachada amarilla con una puerta verde de dos hojas abierta, ventanas de madera oscura con marco blanco y un letrero azul con las dependencias y los horarios de atención.',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000002',
    file: 'corredor.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000002.jpg',
    title: 'Corredor de la entrada',
    altText:
      'Corredor de paredes amarillas y techo abovedado con un cartel oscuro de la oferta cultural del CLENA, una puerta de madera al fondo y, a la derecha, un jardín con palmas y una figura de vaca blanca.',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000003',
    file: 'jardin.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000003.jpg',
    title: 'Jardín y cartel de bienvenida',
    altText:
      'Cartel azul de bienvenida con la lista de espacios del complejo, frente a una pared amarilla, entre palmas y un camino de piedras blancas.',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000004',
    file: 'biblioteca-entrada.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000004.jpg',
    title: 'Pasillo de la biblioteca',
    altText:
      'Pasillo central de piso de mosaico y techo con molduras doradas, con barandas de madera a los lados y, a la derecha, una entrada con el letrero «Colección general».',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000005',
    file: 'biblioteca-meira.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000005.jpg',
    title: 'Hacia la sala de lectura',
    altText:
      'Largo pasillo de piso de mosaico, con barandas de madera oscura y rejas a los lados y, a la izquierda, una entrada con el letrero «Sala de Lectura Meira del Mar».',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000006',
    file: 'biblioteca-estanterias.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000006.jpg',
    title: 'Estanterías de la biblioteca',
    altText:
      'Pasillo entre dos filas de estanterías llenas de libros, con piso de mosaico y un techo con vigas de madera al fondo.',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000007',
    file: 'infantil.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000007.jpg',
    title: 'Mural de la sala infantil',
    altText:
      'Mural azul con figuras que corren sobre olas, mariposas amarillas, un sol y una luna, frente a una fila de sillas blancas, bajo un techo con molduras.',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000008',
    file: 'infantil-mesas.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000008.jpg',
    title: 'Sala infantil con mesas rojas',
    altText:
      'Sala con mesas rojas bajas y sillas verdes pequeñas, computadores sobre un mesón a la izquierda y un mural azul a la derecha, con piso de mosaico.',
  },
  {
    id: '6a1e0001-0000-4000-8000-000000000009',
    file: 'exposiciones-sala.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-000000000009.jpg',
    title: 'Sala de exposiciones',
    altText:
      'Sala amplia de paredes blancas con cuadros enmarcados de escenas de playa, piso de cuadros blancos y negros y luces de riel en el techo.',
  },
  {
    id: '6a1e0001-0000-4000-8000-00000000000a',
    file: 'museo-1.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-00000000000a.jpg',
    title: 'Sala del museo con mapa iluminado',
    altText:
      'Sala oscura con una pantalla azul y naranja con las palabras «Barranquilla» y «Aduana», un panel rojo titulado «Este territorio que somos» y un mapa iluminado con nombres de municipios en la pared.',
  },
  {
    id: '6a1e0001-0000-4000-8000-00000000000b',
    file: 'museo-2.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-00000000000b.jpg',
    title: 'Fotografías históricas del museo',
    altText:
      'Rincón oscuro del museo con la imagen proyectada de un edificio con andamios, un panel de fotografías en blanco y negro titulado «Construyendo un legado» y piso de cuadros blancos y negros.',
  },
  {
    id: '6a1e0001-0000-4000-8000-00000000000c',
    file: 'cafe-entrada.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-00000000000c.jpg',
    title: 'Puerta del Café de la Aduana',
    altText:
      'Puerta de madera con el letrero «Café de la Aduana» sobre una pared blanca con dos placas de mármol; por dentro se ve una mesa con sillas, y el piso del pasillo es de cuadros blancos y negros.',
  },
  {
    id: '6a1e0001-0000-4000-8000-00000000000d',
    file: 'cafe.jpg',
    key: 'gallery/6a1e1001-0000-4000-8000-00000000000d.jpg',
    title: 'Interior del café',
    altText:
      'Salón claro con mesas blancas y sillas beige, una lámpara de bombillos colgantes del techo, máquinas expendedoras al fondo y una puerta de madera abierta a la izquierda.',
  },
];
