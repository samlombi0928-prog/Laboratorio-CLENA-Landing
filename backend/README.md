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

El esquema de la base de datos solo cambia con migraciones: `synchronize` está desactivado.

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
