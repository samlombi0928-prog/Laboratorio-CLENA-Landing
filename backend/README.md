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
- **Límite de intentos:** registro e inicio de sesión aceptan 10 intentos por minuto por IP; después responden 429.
- **Ley 1581:** el registro exige `aceptaPrivacidad: true`. Cada usuario queda con la fecha del consentimiento y la versión del aviso que aceptó (`PRIVACY_NOTICE_VERSION`, hoy provisional).

### Proteger rutas

Toda ruta exige un access token válido, salvo las marcadas con `@Public()`. Los decoradores están en `src/presentation/http/auth/auth.decorators.ts`:

```ts
@Public()                 // ruta abierta, sin sesión
@Roles(Role.Admin)        // solo ciertos roles (admin, staff, public)
@CurrentUser() user       // en un parámetro: { userId, role } de la sesión
```

Sin token, o con uno vencido, la API responde 401; con un rol que no alcanza, 403.

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

En el código, `normalizePageRequest`, `buildPage` y `Page` están en `src/application/common/pagination.ts`; lo usan también la galería y las secciones.

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

Los errores de dominio se traducen así: `ResourceNotFoundError` → 404, `AccessDeniedError` → 403 y `BusinessRuleError` → 422. Cualquier error inesperado responde 500 sin exponer detalles internos y queda en los logs.
