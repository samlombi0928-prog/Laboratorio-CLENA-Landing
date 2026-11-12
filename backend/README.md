# Backend — Recorrido interactivo del CLENA

API REST en NestJS + TypeScript, organizada con Clean Architecture y conectada a PostgreSQL con TypeORM.

## Requisitos

- Node.js 22.12 o superior
- npm
- PostgreSQL 15 o superior

## Cómo correrlo

```bash
cd backend
npm install
cp .env.example .env   # luego ajuste los valores de la base de datos
npm run start:dev
```

La API queda disponible en http://localhost:3000:

| Ruta | Qué es |
|---|---|
| `/api/v1/...` | Endpoints de la API |
| `/docs` | Documentación Swagger (el JSON está en `/docs/json`) |
| `/api/v1/health` | Estado de la API y de la base de datos (200 si está bien, 503 si la base de datos no responde) |

Si falta una variable de entorno o tiene un valor inválido, la aplicación no arranca y el error dice cuál es.

## Variables de entorno

Están documentadas en [`.env.example`](.env.example). El archivo `.env` nunca se sube al repositorio.

| Variable | Para qué sirve | Por defecto |
|---|---|---|
| `NODE_ENV` | `development`, `production` o `test` | `development` |
| `PORT` | Puerto de la API | `3000` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Conexión a PostgreSQL | `DB_PORT=5432`; el resto es obligatorio |
| `LOG_LEVEL` | Nivel de los logs | `info` |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma | `http://localhost:5173` |
| `JWT_ACCESS_SECRET` | Secreto para firmar los access tokens (mínimo 32 caracteres, distinto en cada entorno) | Obligatorio |
| `JWT_ACCESS_TTL_SECONDS` | Duración del access token, en segundos | `900` (15 minutos) |
| `REFRESH_TOKEN_TTL_DAYS` | Duración de la sesión, en días | `7` |
| `SMTP_HOST`, `SMTP_PORT` | Servidor de correo (SMTP) | `localhost` y `1025` (Mailpit) |
| `MAIL_FROM` | Remitente de los correos | `CLENA Digital <no-responder@clena.local>` |
| `STORAGE_DIR` | Carpeta donde se guardan las imágenes subidas. En Docker debe ser un volumen | `storage` |
| `PUBLIC_BASE_URL` | Dirección pública de la API, con la que se arman las URL de las imágenes | `http://localhost:3000` |

Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Corre la versión compilada |
| `npm run lint` | Revisa el código con oxlint, incluida la regla de dependencias entre capas |
| `npm run test` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas e2e de la API |
| `npm run test:cov` | Pruebas unitarias con cobertura (meta: 70 % en dominio y aplicación) |
| `npm run migration:generate -- src/infrastructure/database/migrations/<Nombre>` | Genera una migración a partir de las entidades |
| `npm run migration:run` | Aplica las migraciones pendientes |
| `npm run migration:revert` | Revierte la última migración |
| `npm run usuarios:hacer-admin -- <correo>` | Convierte en administrador a un usuario ya registrado |
| `npm run galeria:semilla` | Carga las 13 imágenes de ejemplo de la galería (ver [Galería](#galería)) |

El esquema de la base de datos solo cambia con migraciones: `synchronize` está desactivado. Después de clonar o de traer cambios, corra `npm run migration:run` antes de `npm run start:dev`.

## Autenticación

| Método y ruta | Sesión | Qué hace |
|---|---|---|
| `POST /api/v1/auth/registro` | No | Crea una cuenta de usuario público (el visitante no necesita cuenta). Cuerpo: `nombre`, `correo`, `contrasena`, `aceptaPrivacidad` |
| `POST /api/v1/auth/login` | No | Cuerpo: `correo`, `contrasena`. Responde `tokenAcceso`, `expiraEn` y `usuario`, y deja el refresh token en una cookie |
| `POST /api/v1/auth/renovar` | Cookie | Cambia el refresh token por uno nuevo y devuelve un access token nuevo |
| `POST /api/v1/auth/logout` | Cookie | Cierra la sesión de ese dispositivo y borra la cookie |
| `GET /api/v1/auth/perfil` | Access token | Datos del usuario con sesión iniciada |

Cómo funciona la sesión:

- **Access token:** JWT de vida corta. Se envía en la cabecera `Authorization: Bearer <tokenAcceso>`. El frontend lo guarda en memoria, no en `localStorage`.
- **Refresh token:** va en la cookie `refresh_token`, que es `httpOnly` (JavaScript no la puede leer), `SameSite=Strict`, solo viaja a `/api/v1/auth` y en producción solo por HTTPS. El frontend debe hacer las peticiones a `/auth` con `credentials: 'include'`.
- **Al recargar la página:** el frontend llama a `POST /renovar` para recuperar la sesión.
- **Rotación:** cada renovación invalida el refresh token anterior. Si alguien usa uno ya invalidado, se cierran todas las sesiones de ese usuario.
- **Varias pestañas:** si dos peticiones renuevan con la misma cookie, solo una lo logra. La otra recibe **409 `SESION_YA_RENOVADA`** y la cookie no se borra, porque el navegador ya tiene la nueva: el frontend solo debe volver a llamar a `POST /renovar`. Esto aplica durante 10 segundos después de la renovación; pasado ese tiempo, el token viejo cuenta como robado.
- **En la base de datos:** las contraseñas se guardan con argon2id y de los refresh tokens solo se guarda su SHA-256.
- **Límite de intentos:** registro e inicio de sesión aceptan 10 intentos por minuto por IP; después responden 429. Detrás de un proxy, como Nginx en Docker, la IP del visitante se toma de la cabecera `X-Forwarded-For` que agrega ese proxy. Por eso en producción el puerto de la API no debe quedar expuesto: solo se entra por el proxy.
- **Ley 1581:** el registro exige `aceptaPrivacidad: true`. Cada usuario queda con la fecha del consentimiento y la versión del aviso que aceptó (`PRIVACY_NOTICE_VERSION`, hoy provisional).

### Proteger rutas

Toda ruta exige un access token válido, salvo las marcadas con `@Public()`. Los decoradores están en `src/presentation/http/auth/auth.decorators.ts`:

```ts
@Public()                 // ruta abierta, sin sesión
@Roles(Role.Admin)        // solo ciertos roles (admin, staff, public)
@CurrentUser() user       // en un parámetro: { userId, role } de la sesión
```

Sin token, o con uno vencido, la API responde 401; con un rol que no alcanza, 403.

En una ruta `@Public()`, si llega un access token válido, `@CurrentUser()` igual trae al usuario; si no llega o no es válido, trae `undefined` y la petición sigue como anónima.

## Gestión de roles

Hay tres roles: **administrador** (`admin`), **personal del CLENA** (`staff`) y **usuario público** (`public`). Quien se registra queda como usuario público.

| Método y ruta | Sesión | Qué hace |
|---|---|---|
| `GET /api/v1/usuarios` | Administrador | Usuarios por nombre. Acepta `pagina`, `porPagina`, `buscar` (por nombre o correo) y `rol` |
| `PATCH /api/v1/usuarios/:id/rol` | Administrador | Cuerpo: `rol`, que puede ser `staff` (nombrarlo personal) o `public` (retirarlo) |

Reglas:

- **Solo el administrador** cambia roles. El personal y los usuarios públicos reciben 403.
- **El rol de administrador no se da ni se quita desde la API:** pedir `admin` responde 400 y tocar a un administrador responde **422 `ROL_DE_ADMINISTRADOR`**.
- **Cuándo se nota el cambio:** el usuario ve su nuevo rol cuando su sesión se renueva, es decir, al recargar la página o en máximo 15 minutos.
- **Paginación:** la misma de los demás listados, `?pagina=1&porPagina=12`, con la respuesta `{ datos, pagina, porPagina, total, totalPaginas }` (`src/application/common/pagination.ts`).

### Crear el primer administrador

Como la API no da el rol de administrador, el primero se crea desde el servidor. La persona se registra normalmente y luego se corre:

```bash
npm run usuarios:hacer-admin -- correo@ejemplo.com
```

## Agenda de eventos

| Método y ruta | Sesión | Qué hace |
|---|---|---|
| `GET /api/v1/eventos` | No | Agenda pública: los eventos publicados, del más próximo al más lejano. Acepta `pagina`, `porPagina` y `buscar` (por título o lugar) |
| `GET /api/v1/eventos/gestion` | Personal o administrador | Todos los eventos, con su `estado`. Acepta además `estado` |
| `POST /api/v1/eventos` | Personal o administrador | Programa un evento. Cuerpo: `titulo`, `descripcion` (opcional), `lugar`, `inicio`, `cupo`, `publicarDesde`, `publicarHasta` |
| `PATCH /api/v1/eventos/:id` | Personal o administrador | Cambia solo los campos que se envían |
| `DELETE /api/v1/eventos/:id` | Personal o administrador | Elimina el evento y sus inscripciones |

Reglas:

- **Publicación por fechas:** cada evento tiene un estado que se calcula con la hora actual, sin que nadie lo publique a mano:

  | `estado` | Cuándo | ¿Sale en la agenda? |
  |---|---|---|
  | `pendiente` | Antes de `publicarDesde` | No |
  | `publicado` | Desde `publicarDesde` hasta `publicarHasta`, mientras no haya empezado | Sí, y recibe inscripciones |
  | `cerrado` | Después de `publicarHasta`, o cuando el evento empieza | No |

- **Fechas con zona horaria:** `inicio`, `publicarDesde` y `publicarHasta` van en ISO 8601 con zona, por ejemplo `2026-11-21T19:00:00-05:00`. Sin la zona responde 400, porque "19:00" sería la hora del servidor y no la de Colombia. La API devuelve las fechas en UTC.
- **Periodo válido:** si `publicarHasta` es anterior a `publicarDesde`, responde **422 `PERIODO_DE_PUBLICACION_NO_VALIDO`**, también al editar solo una de las dos.
- **Eliminar:** también borra las inscripciones del evento. El panel debe pedir confirmación.

Con los eventos de ejemplo, la agenda pública muestra el taller, el jazz y la feria; en el panel, la visita sale `pendiente` y el conversatorio `cerrado`.

## Eliminar mi cuenta

Derecho de supresión de la Ley 1581 de 2012 (HU-10).

| Método y ruta | Sesión | Qué hace |
|---|---|---|
| `DELETE /api/v1/cuenta` | Cualquier usuario con sesión | Elimina su propia cuenta y sus datos. Cuerpo: `contrasena`. Responde 204 y borra la cookie de la sesión |

Qué se borra y qué no:

| Dato | Qué pasa |
|---|---|
| La cuenta (nombre, correo, hash de la contraseña, consentimiento) | Se elimina |
| Sus sesiones abiertas | Se eliminan (`ON DELETE CASCADE`): la sesión no se puede renovar |
| Sus recorridos | Se eliminan (`ON DELETE CASCADE`), y sus **portadas se borran del almacenamiento** |
| Sus inscripciones a eventos | Se eliminan **por correo**: `event_registrations` no está ligada a la cuenta, así que se borran las inscripciones hechas con el mismo correo |
| Las imágenes de la galería que subió | **Se conservan**, con `uploaded_by` vacío (`ON DELETE SET NULL`): son contenido del CLENA, no de la persona |

Reglas:

- **Pide la contraseña otra vez** (`contrasena`), porque no se puede deshacer y así un access token robado no alcanza. Si no es correcta responde **422 `CONTRASENA_INCORRECTA`**; no usa 401 para que el frontend no lo confunda con un access token vencido y vuelva a intentarlo.
- **La única cuenta de administrador no se puede eliminar:** responde **422 `ULTIMO_ADMINISTRADOR`**. Primero hay que nombrar a otro administrador con `usuarios:hacer-admin`.
- **Todo o nada:** las inscripciones y la cuenta (con sus recorridos y sesiones) se borran en **una sola transacción**. Después se borran los archivos; si alguno falla, la cuenta ya no existe y queda un aviso en los logs con las claves que sobraron (son rutas con un uuid, sin datos personales).
- **Límite de intentos:** 10 por minuto y por IP, igual que el inicio de sesión, porque la ruta comprueba una contraseña.
- **Limitación conocida:** el access token dura hasta 15 minutos y no se revoca. Con ese token una cuenta ya eliminada recibe 404 en `/auth/perfil`, y si intenta crear un recorrido recibe un 500 (la llave foránea no existe), sin dejar datos ni archivos. Después de ese tiempo, 401.

El código está en `src/application/users/delete-account.use-case.ts`; la transacción, en `src/infrastructure/users/typeorm-account-eraser.ts`.

## Inscripciones a eventos

| Método y ruta | Sesión | Qué hace |
|---|---|---|
| `POST /api/v1/eventos/:id/inscripciones` | No | Inscribe a una persona. Cuerpo: `nombre`, `correo`, `aceptaPrivacidad`. Envía un correo de confirmación |
| `GET /api/v1/eventos/:id/inscripciones` | Personal o administrador | Inscritos del evento, en orden de inscripción. Acepta `pagina`, `porPagina` y `buscar` (por nombre o correo) |

Reglas:

- **Sin cuenta:** solo se piden el nombre y el correo, los datos mínimos para confirmar el cupo (Ley 1581). Sin `aceptaPrivacidad: true` responde **422 `CONSENTIMIENTO_REQUERIDO`** y no guarda nada.
- **Evento publicado:** solo se puede inscribir a un evento que esté en su periodo de publicación y no haya empezado. Si no, responde 404.
- **Cupo:** cuando se llena, responde **409 `EVENTO_SIN_CUPOS`**. Las inscripciones simultáneas esperan su turno, así que nunca se pasan del cupo.
- **Un correo por evento:** si el correo ya está inscrito, responde **409 `YA_INSCRITO`**.
- **Correo de confirmación:** si no se puede enviar, la inscripción igual queda guardada y la respuesta trae `correoEnviado: false`.
- **Límite de intentos:** 10 inscripciones por minuto por IP.

### Eventos de ejemplo para la demo

`npm run migration:run` carga cinco eventos de ejemplo, con fechas relativas al día en que se corre la migración y en hora de Colombia:

| Evento | Para probar |
|---|---|
| Noche de jazz en la Aduana | Una inscripción normal (40 cupos) |
| Taller de fotografía patrimonial | El evento lleno: tiene 3 cupos |
| Feria del libro del Caribe | Una inscripción normal (100 cupos) |
| Visita guiada al Archivo Histórico | Todavía no se publica: responde 404 |
| Conversatorio sobre la historia del puerto | Ya pasó: responde 404 |

Los identificadores están en `src/infrastructure/database/migrations/1794069800002-SeedEvents.ts`.

### Ver los correos en desarrollo

Los correos se envían a [Mailpit](https://mailpit.axllent.org/), que los atrapa y los muestra en una página local en vez de entregarlos:

```bash
docker run -d --name clena-mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit:v1.27
```

Los correos se ven en http://localhost:8025.

### Paginación de los listados

Los listados reciben `?pagina=1&porPagina=12` (`porPagina` máximo 50) y responden con la misma forma:

```json
{ "datos": [], "pagina": 1, "porPagina": 12, "total": 42, "totalPaginas": 4 }
```

En el código, `normalizePageRequest`, `buildPage` y `Page` están en `src/application/common/pagination.ts`; lo usan también la galería, las secciones y la agenda.

## Recorridos

| Método y ruta | Sesión | Qué hace |
|---|---|---|
| `POST /api/v1/recorridos` | Access token | Crea un recorrido en borrador. Campos: `titulo` (obligatorio, máximo 120 caracteres), `descripcion` (opcional, máximo 2000) y `portada` (opcional) |
| `GET /api/v1/recorridos/mios` | Access token | Recorridos del usuario, incluidos los borradores, del más reciente al más antiguo. Paginado con `pagina` y `porPagina`; responde `{ datos, pagina, porPagina, total, totalPaginas }` |
| `GET /api/v1/recorridos/:id` | Opcional | Un recorrido publicado lo ve cualquiera; un borrador, solo su creador. Para cualquier otro responde 404, como si no existiera. Si se manda un token vencido o inválido, responde 401 para que el frontend renueve la sesión |

Cómo funciona la portada:

- **Formato:** se envía como `multipart/form-data`, con la imagen en el campo `portada`. Sin portada, el cuerpo también puede ir en JSON.
- **Validación:** solo JPG o PNG, revisando los primeros bytes del archivo y no la extensión. Máximo 5 MB. Un archivo más grande responde 413; uno que no es imagen, 422.
- **Almacenamiento:** se guarda con el puerto `FileStorage` (`src/application/storage/ports/`). En la base de datos queda la clave del archivo (`cover_key`) y la respuesta trae la URL en `portadaUrl`.

## Galería

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `GET /api/v1/galeria` | Cualquiera, sin sesión | Lista las imágenes, paginada. Parámetros opcionales: `pagina` (por defecto 1), `porPagina` (por defecto 12, máximo 50), `orden` (`recientes` o `antiguas`, por fecha de subida) y `buscar` (texto que debe contener el título) |
| `POST /api/v1/galeria` | Personal del CLENA y administradores | Sube una imagen. Campos: `titulo` (máximo 120 caracteres), `textoAlternativo` (máximo 250) e `imagen` (el archivo), todos obligatorios |
| `DELETE /api/v1/galeria/:id` | Personal del CLENA y administradores | Elimina la imagen de la galería y su archivo del almacenamiento. Responde 204 |

La lista responde con esta forma, y `totalPaginas` permite armar la paginación en el frontend:

```json
{
  "datos": [
    {
      "id": "7d0c2f4e-1b9a-4f3e-8c2d-5a6b7c8d9e0f",
      "titulo": "Fachada de la Aduana",
      "textoAlternativo": "Fachada de ladrillo de la antigua Aduana vista desde la plaza",
      "imagenUrl": "http://localhost:3000/archivos/gallery/7d0c2f4e-….jpg",
      "creadoEn": "2026-11-07T12:00:00.000Z"
    }
  ],
  "pagina": 1,
  "porPagina": 12,
  "total": 25,
  "totalPaginas": 3
}
```

Cómo funciona la subida:

- **Formato:** `multipart/form-data`, con la imagen en el campo `imagen`.
- **Validación:** solo JPG o PNG, revisando los primeros bytes del archivo y no la extensión. Máximo 10 MB. Un archivo más grande responde 413; uno que no es JPG ni PNG, o la falta de imagen, 422, y el mensaje explica el motivo. Todo se valida antes de guardar el archivo, así que una petición inválida no deja archivos sueltos.
- **Base de datos:** la tabla `gallery_images` guarda la clave del archivo (`image_key`), nunca la URL. Si falla el guardado en la base de datos, el archivo recién subido se borra.
- **Cuenta eliminada (#16):** `uploaded_by` queda en `NULL` y la imagen se conserva, porque es contenido del CLENA y no de la persona.

### Imágenes de ejemplo para la demo

```bash
npm run galeria:semilla
```

Carga 13 fotos del recorrido (la fachada, los pasillos de la biblioteca, la sala infantil, el museo y el café), así que la galería tiene una segunda página para probar la paginación. Las fotos están en `backend/seed/galeria/`, son las que el equipo de origen autorizó a usar y en ninguna se reconoce a una persona.

- **Se puede correr más de una vez:** lo que ya existe no se duplica. Si falta un archivo, por ejemplo porque se perdió el volumen de `STORAGE_DIR`, se vuelve a copiar.
- **Por qué no es una migración:** una migración solo cambia la base de datos, y estas imágenes también necesitan sus archivos en `STORAGE_DIR`. Este comando hace las dos cosas.
- **En Docker:** hay que correrlo dentro del contenedor del backend, después de que arranque: `docker compose exec backend npm run galeria:semilla`.
- **Las filas llevan `uploaded_by` vacío:** no las subió ninguna cuenta. Desde el panel se pueden eliminar como cualquier otra imagen, y eso borra también su archivo.
- Los textos alternativos están en `src/infrastructure/database/gallery-seed-data.ts`. Describen solo lo que se ve en cada foto; una prueba (`gallery-seed-data.spec.ts`) comprueba que respeten los límites de la galería y que los archivos existan.

## Almacenamiento de archivos

Las imágenes se guardan en disco, en la carpeta `STORAGE_DIR`, con `DiskFileStorage` (`src/infrastructure/storage/`).

- **Clave:** cada archivo queda como `<carpeta>/<uuid>.<jpg|png>` (por ejemplo `gallery/7d0c2f4e-….jpg`), con la carpeta `covers`, `scenes` o `gallery`. La clave es lo único que se guarda en la base de datos; la URL se calcula al responder.
- **Escritura segura:** se escribe en un archivo `.tmp` y luego se mueve a su nombre final, así nunca queda visible un archivo a medio escribir.
- **Seguridad:** solo se acepta una clave con esa forma exacta, así que ninguna clave puede salir de `STORAGE_DIR` (por ejemplo con `../`).
- **Cómo se ven:** `GET /archivos/<clave>` (fuera de `/api/v1`). La respuesta lleva caché de un año y `X-Content-Type-Options: nosniff`; si el archivo no existe responde 404 con el formato de error de la API.
- **Despliegue:** `STORAGE_DIR` debe ser un volumen de Docker. Si no, las imágenes se pierden al recrear el contenedor.

## Estructura

```
src/
├── domain/          Entidades, reglas de negocio y errores. TypeScript puro.
├── application/     Casos de uso y puertos (interfaces) que necesitan.
├── infrastructure/  Implementación de los puertos: TypeORM, configuración, logs.
├── presentation/    Controladores REST, DTOs de entrada, validación y filtro de errores.
├── modules/         Módulos de NestJS que unen cada puerto con su implementación.
├── app.module.ts
└── main.ts
```

Las dependencias apuntan siempre hacia el dominio. `npm run lint` falla si:

- `domain/` importa NestJS, TypeORM u otra librería de infraestructura, o cualquier otra capa.
- `application/` importa frameworks, `infrastructure/`, `presentation/` o `modules/`.
- `presentation/` importa `infrastructure/`, `modules/` o TypeORM.

### Cómo agregar un caso de uso

Los nombres de código (clases, archivos, funciones y variables) van en inglés. Los mensajes para el usuario, los campos del JSON de respuesta y los comentarios van en español.

El módulo de salud (`/api/v1/health`) sirve de ejemplo:

1. **Puerto** en `application/<module>/ports/`: una interfaz y su token (`Symbol`). Ejemplo: `DatabaseChecker` y `DATABASE_CHECKER`.
2. **Caso de uso** en `application/<module>/<action>.use-case.ts`: una clase sin decoradores que recibe el puerto por el constructor. Ejemplo: `CheckHealthUseCase`.
3. **Implementación** del puerto en `infrastructure/<module>/`. Ejemplo: `TypeOrmDatabaseChecker`. Las entidades del ORM se llaman `*.orm-entity.ts` y se mapean a entidades de dominio; nunca salen de esta capa.
4. **Controlador y DTOs** en `presentation/http/<module>/`. El controlador solo invoca casos de uso. Ejemplo: `HealthController`.
5. **Módulo** en `modules/<module>.module.ts`: provee el puerto con `useClass` y crea el caso de uso con `useFactory`. Ejemplo: `HealthModule`.

### Formato de los errores

Todas las respuestas de error tienen la misma forma:

```json
{
  "estado": 400,
  "codigo": "VALIDACION",
  "mensaje": "Los datos enviados no son válidos",
  "detalles": [{ "campo": "titulo", "errores": ["titulo should not be empty"] }],
  "ruta": "/api/v1/recorridos",
  "fecha": "2026-11-04T12:00:00.000Z"
}
```

Los errores de dominio se traducen así: `AuthenticationError` → 401, `AccessDeniedError` → 403, `ResourceNotFoundError` → 404, `ConflictError` → 409 y `BusinessRuleError` → 422. Cualquier error inesperado responde 500 sin exponer detalles internos y queda en los logs.
