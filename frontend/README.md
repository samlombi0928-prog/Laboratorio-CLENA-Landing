# Frontend — Recorrido interactivo del CLENA

Aplicación en React 19 + TypeScript, creada con Vite. Tiene la landing pública del CLENA (portada, recorrido, agenda y galería) y el panel donde el personal administra el contenido.

## Requisitos

- Node.js 20.19 o superior (o 22.12 o superior)
- npm
- La API del backend corriendo en http://localhost:3000 (ver [backend/README.md](../backend/README.md)). Sin ella, el recorrido funciona, pero la portada no carga sus secciones y no se puede iniciar sesión.

## Cómo correrlo

```bash
cd frontend
npm ci
npm run dev
```

La aplicación queda disponible en http://localhost:5173.

En desarrollo, Vite pasa `/api` y `/archivos` al backend (`vite.config.ts`). Así la página y la API quedan en el mismo origen, como en el despliegue, y la cookie de sesión (`SameSite=strict`) funciona.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Revisa los tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión de producción para probarla |
| `npm run lint` | Revisa el código con ESLint |
| `npm test` | Corre las pruebas una vez (Vitest) |
| `npm run test:watch` | Corre las pruebas cada vez que cambia un archivo |

## Pantallas

| Ruta | Pantalla | Quién entra |
|---|---|---|
| `/` | Portada con espacios, servicios y horarios | Todos |
| `/recorrido/clena/:sala` | Recorrido por las salas, con su historia | Todos |
| `/agenda` | Eventos publicados, del más próximo al más lejano | Todos |
| `/eventos/:id/inscripcion` | Inscribirse a un evento (sin cuenta) | Todos |
| `/galeria` | Galería de fotos | Todos |
| `/ingresar`, `/registro`, `/aviso-de-privacidad` | Cuenta y aviso de privacidad (Ley 1581) | Todos |
| `/mi-cuenta` | Datos de la cuenta y eliminarla | Con sesión |
| `/panel` | Inicio del panel | Personal y administrador |
| `/panel/secciones` | Espacios, servicios y horarios de la portada | Personal y administrador |
| `/panel/agenda` | Programar, editar y eliminar eventos | Personal y administrador |
| `/panel/eventos/:id/inscritos` | Personas inscritas a un evento | Personal y administrador |
| `/panel/galeria` | Subir y eliminar imágenes | Personal y administrador |
| `/panel/usuarios` | Nombrar o retirar al personal del CLENA | Administrador |

Las rutas privadas usan `RutaProtegida` (`src/sesion/RutaProtegida.tsx`): sin sesión llevan a `/ingresar?volver=…` y, si el rol no alcanza, muestran un aviso. `/mi-cuenta` no la usa, porque después de eliminar la cuenta tiene que poder mostrar el aviso final.

## Estructura

```
src/
  api/          Llamadas a la API, una por recurso (secciones, eventos, inscripciones, galería, usuarios)
  componentes/  Piezas que se reusan: visor 360°, cuadro de historia, formularios, campos…
  datos/        Las salas del recorrido del CLENA
  paginas/      Una pantalla por archivo, con su CSS al lado
  pruebas/      Preparación de las pruebas y utilidades para montar pantallas con sesión
  sesion/       Inicio de sesión, renovación del token y rutas protegidas
  tipos/        Tipos del recorrido (escena, conexión, fragmento de historia, punto de interés)
```

## Sesión

- El **token de acceso** vive solo en memoria, nunca en `localStorage`. Se renueva un minuto antes de que venza.
- El **token de renovación** está en una cookie `httpOnly` que pone la API. Al recargar la página, la sesión se recupera con esa cookie.
- `pedirConSesion` (de `useSesion()`) agrega el token a cada petición; si la API responde 401, renueva la sesión una vez y repite la petición.
- Si dos peticiones necesitan renovar al mismo tiempo, esperan la misma renovación: la API rechaza que se use dos veces la misma cookie.

## Recorrido

Las 21 salas están en `src/datos/recorrido-clena.ts`. Por ahora son datos fijos; pasan a la API con el editor de recorridos (#18).

**Agregar una sala**

1. Poner la foto en `public/escenas/<id>.jpg`. Las de la cámara Kodak se usan enderezadas, de 1469 × 1800 px, y cubren unos 100° de ancho.
2. Agregarla en `escenasClena` con `kodak(id, nombre, descripción, conexiones, historia)`. La **descripción** es lo que escucha quien usa lector de pantalla: es obligatoria.
3. En `conexiones` van los botones que llevan a otras salas, con su posición en grados.

**Ubicar un botón sobre la foto.** Para un punto en la posición (x, y) de la imagen, con x y y entre 0 y 1 desde la esquina superior izquierda:

- `yaw = (x − 0,5) × 100`: negativo a la izquierda.
- `pitch = (0,5 − y) × 122,5`: negativo hacia abajo.

Los puntos de interés de cada sala (los botones amarillos) están en el objeto `puntosInteres` del mismo archivo.

## Accesibilidad

Cada pantalla nueva cumple esto antes de su Pull Request:

- Se puede usar solo con teclado y el foco siempre se ve. Al cambiar de contenido, el foco va al título o al mensaje nuevo.
- Los formularios tienen etiquetas visibles. Los errores van junto a cada campo (`aria-invalid` y `aria-describedby`) y en un resumen con `role="alert"`.
- Los botones miden al menos 44 × 44 px. Si el texto visible no basta (por ejemplo «Eliminar» en una lista), se completa con un `<span className="solo-lectores">`.
- Contraste WCAG AA.
- Con el texto al 200 % en un celular de 375 px no aparece barra horizontal. En cuadrículas, usar `minmax(min(…, 100%), 1fr)`.
- axe sin errores, con la pantalla vacía y con los errores del formulario a la vista.

## Pruebas

Las pruebas van junto al archivo que prueban (`Componente.test.tsx`) y buscan los elementos por su rol y su nombre accesible, como los encontraría un lector de pantalla. Para montar una pantalla con una sesión de mentira se usa `montar()` de `src/pruebas/utilidades.tsx`.

El CI corre `npm run lint`, `npm test` y `npm run build` en cada Pull Request.
