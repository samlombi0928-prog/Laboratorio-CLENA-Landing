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
