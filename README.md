# Waifu Panel App

Interactive tooling for the “your waifu ain’t shit” panel. The project runs as a local-first web app with optional cloud deployment.

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO. Prisma ORM with SQLite default storage.
- **Frontend**: React + Vite + React Router + TanStack Query.
- **Shared**: TypeScript types via a workspace package (`@waifu-panel/shared`).
- **Containerisation**: Docker multi-stage build and Compose local show mode (see `docs/deployment.md`).

Architecture, schema, and event plans live under `docs/`.

## Requirements

- Node.js 20.x is recommended for show-day and database work. Node 22 worked for build/test in the inspected environment, but Node 20 remains the conservative target.
- PNPM v8.

## Initial Setup

```bash
pnpm install
```

Or run the setup helper, which installs dependencies and generates Prisma Client:

```bash
pnpm setup
```

Create a data directory for local SQLite and uploads (already added to `.gitignore`):

```bash
mkdir -p apps/data/uploads
```

Copy `.env.example` into place and tweak if needed:

```bash
cp apps/server/.env.example apps/server/.env
```

Ensure `CORS_ORIGIN` lists the frontend origin (e.g. `http://localhost:5173`). Multiple origins can be comma-separated.

Client-side env vars (via Vite) can live in `apps/web/.env.local`:

- `VITE_API_BASE_URL` — defaults to `http://localhost:3000`.
- `VITE_SOCKET_URL` — optional override if websocket endpoint differs from the API base.

## Database

Prisma is configured for SQLite by default. Migration commands need a fully-qualified `DATABASE_URL` (absolute path recommended, e.g. `file:/home/.../data/app.db`). Node 22 works when that env var is set; if you hit engine errors, falling back to Node 20 is still a safe option.

```bash
# from repo root
export DATABASE_URL="file:${PWD}/apps/data/app.db"
pnpm db:migrate -- --name init
```

After migrations run you can regenerate the client at any time:

```bash
pnpm db:generate
```

## Running the Apps

### Backend (Express + Socket.IO)

```bash
pnpm dev:server
```

Starts on `http://localhost:3000`, serving REST endpoints:

- `GET /healthz` — process, database, and queue health.
- `POST /api/submissions` — submission intake with lightweight cookie tracking.
- `GET /api/submissions/status/:id` — submission status.
- `GET /api/characters/queue` — current queue snapshot.
- `PATCH /api/characters/queue/:characterId` — move a queued character, control auth required.
- `POST /api/moderation/:characterId` — approve/reject/skip.
- `POST /api/rounds/start` — begin a round.
- `POST /api/rounds/end` — end a round.
- `POST /api/rounds/skip` — close a round and discard its votes.
- `GET /api/rounds/current` — current live round snapshot.
- `POST /api/votes` — submit or update an audience vote.
- `GET /api/auth/control`, `POST /api/auth/control`, `DELETE /api/auth/control` — control deck passcode session.

### Frontend (React app)

```bash
pnpm dev:web
```

Launches Vite on `http://localhost:5173`. The submission page is wired to the API (`VITE_API_BASE_URL` defaults to `http://localhost:3000`). Attendees can upload images directly or fall back to a hosted image URL.

To run both development servers:

```bash
pnpm dev
```

## Build & Test

```bash
pnpm build
pnpm test
pnpm lint
```

The server build/test scripts generate Prisma Client before running. Web and shared package test scripts currently pass when no local tests exist, so the workspace test command reports actual test failures instead of empty-package failures.

After `pnpm build`, the server can serve the compiled web app from `apps/web/dist`:

```bash
pnpm start
```

The health endpoint at `http://localhost:3000/healthz` checks process uptime, database access, and current queue length.

## Useful Docs

- `docs/architecture.md` — overall system design.
- `docs/data-model.md` — schema plan.
- `docs/realtime-events.md` — socket contracts.
- `docs/deployment.md` — Docker & ops notes.

## Roadmap

- Add runtime validation schemas for shared API/socket contracts where useful.
- Add more frontend coverage around control and audience state transitions.
- Add cloud storage/Postgres support after local show mode stays boring.
- Add richer moderator identity beyond the shared control passcode.
- Desktop packaging (Electron/Tauri) for show-day convenience.
