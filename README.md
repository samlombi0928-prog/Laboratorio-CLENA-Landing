# CLENA Digital — Landing interactiva del CLENA

Aplicación web para promocionar el **CLENA** (Corporación Luis Eduardo Nieto Arteta, complejo de la antigua Aduana de Barranquilla). Los visitantes pueden **recorrer sus espacios como en Street View**, conocer su historia sala por sala, consultar servicios y horarios, ver la agenda de eventos e inscribirse. El personal del CLENA administra todo ese contenido desde un panel, sin tocar el código.

Proyecto final del curso de **Backend** (Universidad del Norte), construido con el equipo de Introducción a la Ingeniería de Sistemas que visitó el CLENA.

## Problema que resuelve

El CLENA no tiene un espacio digital que presente de forma clara y atractiva su información institucional, sus espacios, sus servicios y sus actividades. Quien no ha ido no sabe qué hay adentro, y el personal no tiene dónde publicar eventos ni recibir inscripciones.

La propuesta del equipo de Introducción fue una **landing page publicitaria interactiva**: un recorrido por los espacios del CLENA donde la historia del lugar aparece poco a poco, más secciones que el personal pueda mantener al día.

## Equipo de origen

Equipo de **Introducción a la Ingeniería de Sistemas** que visitó el CLENA, identificó el problema y valida este proyecto:

- **Samuel Lombana** (contacto principal) — [@samlombi0928-prog](https://github.com/samlombi0928-prog)
- **Alan Fontalvo**

## Integrantes

| Integrante | Rol Scrum | Área técnica | GitHub |
|---|---|---|---|
| Samuel Ramos | Product Owner | Frontend, UX y accesibilidad | [@sramoscor](https://github.com/sramoscor) |
| Sebastián Brito | Scrum Master | DevOps y calidad | [@sbritoa20](https://github.com/sbritoa20) |
| Camilo del Toro | Development Team (Tech Lead) | Arquitectura backend y seguridad | [@CaDelTo](https://github.com/CaDelTo) |
| Jeison Acosta | Development Team | Base de datos y almacenamiento | [@Aeon616](https://github.com/Aeon616) |

## Funcionalidades

**Entrega 1 (alcance obligatorio):**

| Funcionalidad | Historias |
|---|---|
| Recorrido por los espacios: arrastrar para mirar, pasar de una sala a otra e historia de cada sala | [#7](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/7), [#8](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/8), [#9](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/9), [#11](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/11) |
| Secciones de la landing (espacios, servicios, horarios) administrables desde un panel | [#42](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/42), [#43](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/43) |
| Agenda de eventos con publicación por fechas | [#44](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/44), [#45](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/45) |
| Galería con carga de imágenes | [#47](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/47), [#48](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/48) |
| Inscripción a eventos con consentimiento y confirmación por correo | [#46](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/46) |
| Registro e inicio de sesión con JWT y tres roles: administrador, personal del CLENA y usuario público | [#15](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/15), [#24](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues/24) |

El backlog completo está en los [Issues](https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing/issues?q=label%3A%22historia+de+usuario%22) con la etiqueta **historia de usuario**.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript, Vite, React Router, Photo Sphere Viewer (visor 360°) |
| Backend | NestJS + TypeScript con Clean Architecture, TypeORM, Swagger |
| Base de datos | PostgreSQL 15 o superior |
| Contenedores | Docker y docker-compose |

## Estructura del repositorio

```
backend/     API REST en NestJS (dominio, aplicación, infraestructura y presentación)
frontend/    Aplicación web en React
docs/        Informes del proyecto en PDF e imágenes (docs/img/)
```

Las carpetas `problema/` y `propuesta/` de la raíz son el material original del equipo de Introducción. Las fotos originales de la visita están en el Drive del equipo; en el repositorio solo quedan las versiones comprimidas que usa el recorrido (`frontend/public/escenas/`).

## Cómo levantar el proyecto

### Con Docker (recomendado)

Requisitos: Docker y docker-compose.

```bash
git clone https://github.com/samlombi0928-prog/Laboratorio-CLENA-Landing.git
cd Laboratorio-CLENA-Landing
cp backend/.env.example backend/.env
docker compose up
```

### Sin Docker

Requisitos: Node.js 22.12 o superior y PostgreSQL 15 o superior.

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # ajustar los datos de la base de datos
npm run migration:run
npm run start:dev
```

**Frontend** (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```

### Direcciones

| Dirección | Qué es |
|---|---|
| http://localhost:5173 | Aplicación web |
| http://localhost:3000/api/v1 | API REST |
| http://localhost:3000/docs | Documentación de la API (Swagger) |
| http://localhost:3000/api/v1/health | Estado de la API y de la base de datos |

Más detalles en [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/inception.pdf](docs/inception.pdf) | Acta de la reunión de Inception con el equipo de Introducción |
| [docs/modelo-dominio.pdf](docs/modelo-dominio.pdf) | Modelo de dominio, reglas de negocio, glosario y casos de uso |
| [docs/modelo-datos.pdf](docs/modelo-datos.pdf) | Diagrama entidad-relación e índices |
| [docs/arquitectura.pdf](docs/arquitectura.pdf) | Arquitectura con el modelo C4 y decisiones técnicas |
| [docs/daily-scrum.pdf](docs/daily-scrum.pdf) | Actas de las Daily Scrum |
| [docs/evidencias.pdf](docs/evidencias.pdf) | Enlaces a las grabaciones de las reuniones |

## Forma de trabajo

- **Scrum** con sprints de dos semanas, tablero en GitHub Projects y un milestone por sprint.
- **GitHub Flow:** `main` protegida; cada issue se trabaja en una rama `feat/<issue>-descripcion`, `fix/…` o `docs/…`, con commits en formato Conventional Commits y un Pull Request que referencia su issue y necesita la aprobación de otro integrante.

## Aplicación desplegada

Pendiente.
