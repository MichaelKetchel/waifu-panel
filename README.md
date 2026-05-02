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

The server is the runtime source of truth for public addresses through `GET /api/config/public`:

- `PUBLIC_FRONTEND_URL` — optional public frontend base URL used for generated audience links and the Display QR code; defaults to the request origin.
- `PUBLIC_BACKEND_URL` — optional public backend base URL used for REST, uploads, and sockets; defaults to `PUBLIC_BASE_URL`, then the request origin.
- `SUBMISSION_IMAGE_MAX_MB` — maximum uploaded image size for submissions, in megabytes; defaults to `5`.

Client-side env vars (via Vite) can live in `apps/web/.env.local`:

- `VITE_API_BASE_URL` — backend target for the Vite dev proxy; defaults to `http://localhost:3000`.
- `VITE_CONFIG_URL` — optional config endpoint override; defaults to `/api/config/public`.

## Database

Prisma is configured for SQLite by default. If `DATABASE_URL` is not set, server runtime and Prisma scripts use `file:../../data/app.db` relative to `apps/server/prisma`, which resolves to `apps/data/app.db`.

Use an absolute `DATABASE_URL` when you want an explicit database location:

```bash
# from repo root
export DATABASE_URL="file:${PWD}/apps/data/app.db"
pnpm db:migrate -- --name init
```

Or use the default path directly:

```bash
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
- `GET /api/submissions/mine` — this device's submissions, remaining active slots, and rejection reasons.
- `GET /api/submissions/status/:id` — submission status.
- `DELETE /api/submissions/:id` — manual moderator delete for non-live submissions.
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

Launches Vite on `http://localhost:5173`. The submission page is wired to the API through the Vite dev proxy (`VITE_API_BASE_URL` defaults to `http://localhost:3000`). Attendees can upload images directly or fall back to a hosted image URL.

To run both development servers:

```bash
pnpm dev
```

To make both development servers reachable from phones or other devices on the same network:

```bash
pnpm dev:lan
```

This is the preferred show-floor development command. It exports server-owned `PUBLIC_FRONTEND_URL` and `PUBLIC_BACKEND_URL` values from the detected LAN IP, so the Display QR code points phones at the reachable voting page.

If auto-detection picks the wrong interface, pass the LAN IP explicitly:

```bash
LAN_IP=192.168.1.42 pnpm dev:lan
# or
pnpm dev:lan -- 192.168.1.42
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
