# DevNet

## Project Overview

DevNet is a modern, open-source platform for developers to share knowledge, publish posts, and connect with the community. Built with Vite, React, TypeScript, shadcn-ui, and Tailwind CSS, with a self-hosted Fastify API, PostgreSQL, and Redis running on Docker Compose.

## Features

- 📝 **Post Creation & Feed**: Write, publish, and browse posts with rich content and tags.
- 🔍 **Tag System**: Discover and filter content by popular tags.
- 👤 **User Authentication**: Email/password sign up and sign in (httpOnly cookie sessions).
- 🏆 **Admin Dashboard**: Manage users, posts, and platform stats (admin/moderator access required).
- 📊 **Engagement**: Like, comment, bookmark, and view post stats (schema ready).
- ⚡ **Modern UI**: Responsive, accessible, and themeable design inspired by Dev.to.
- 🛡️ **Role-based Access**: Admin and moderator roles for platform management.

## Technologies Used

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [shadcn-ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- [Fastify](https://fastify.dev/) API (`server/`)
- [PostgreSQL](https://www.postgresql.org/) + [Redis](https://redis.io/)
- [Docker Compose](https://docs.docker.com/compose/) (network `devnet`)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v20 recommended)
- [Docker](https://www.docker.com/) + Docker Compose
- npm

### Full stack (recommended)

```sh
cp .env.example .env
# edit JWT_SECRET, POSTGRES_PASSWORD, ADMIN_* as needed

docker compose up -d --build
```

- App (via edge): [http://127.0.0.1:8088/devnet/](http://127.0.0.1:8088/devnet/)
- API health: [http://127.0.0.1:8088/devnet/api/health](http://127.0.0.1:8088/devnet/api/health)

Default admin (from env / `.env.example`): `admin@devnet.local` / `AdminPassword123!`

Scale API replicas:

```sh
docker compose up -d --scale api=3
```

### Frontend-only local development

With Compose running (API on `127.0.0.1:4000`):

```sh
npm install
npm run dev
```

Vite serves the SPA on [http://localhost:8080/devnet/](http://localhost:8080/devnet/) and proxies `/devnet/api` to the API.

### Project Structure

- `src/` — React SPA
  - `components/` — Layout, PostCard, UI primitives
  - `contexts/` — AuthContext (cookie session)
  - `lib/api.ts` — fetch client (`credentials: 'include'`)
  - `pages/` — Index, Auth, Write, Admin, etc.
- `server/` — Fastify API, SQL migrations, Redis cache
- `infra/nginx/` — edge (in Compose) + host modular/standalone templates
- `docs/` — deployment guide + diagrams
- `docker-compose.yml` — postgres, redis, api, edge on network `devnet`

### Environment

Copy [`.env.example`](.env.example). Important variables:

| Variable | Purpose |
| --- | --- |
| `EDGE_PORT` | Host loopback port for the edge container (default `8088`) |
| `POSTGRES_*` | Database credentials |
| `JWT_SECRET` | Signs session cookies |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin on first API boot |

Do not commit real secrets in `.env`.

## Deployment

Production deploys via GitHub Actions on the self-hosted runner: checkout → `docker compose up -d --build` → host Nginx proxies `/devnet/` to the edge container.

- Guide: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**
- Deploy flow diagram: **[docs/deployment-flow.html](docs/deployment-flow.html)**
- System design diagram: **[docs/system-design.html](docs/system-design.html)**

## License

This project is open-source and available under the [MIT License](LICENSE).
