# Waifu Panel App

Interactive tooling for the “your waifu ain’t shit” panel. The project runs as a local-first web app with optional cloud deployment.

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO (sockets not implemented yet). Prisma ORM with SQLite default storage.
- **Frontend**: React + Vite + React Router + TanStack Query.
- **Shared**: TypeScript types via a workspace package (`@waifu-panel/shared`).
- **Containerisation**: Planned Docker multi-stage build (see `docs/deployment.md`).

Architecture, schema, and event plans live under `docs/`.

## Requirements

- Node.js 20.x (Node 22 works for dev/build, but Prisma migrations currently fail). Recommended: install `fnm`/`nvm` and use Node 20 for database tasks.
- PNPM v8.

## Initial Setup

```bash
pnpm install
```

Create a data directory for local SQLite and uploads (already added to `.gitignore`):

```bash
mkdir -p data/uploads
```

Copy `.env.example` into place and tweak if needed:

```bash
cp apps/server/.env.example apps/server/.env
```

Ensure `CORS_ORIGIN` lists the frontend origin (e.g. `http://localhost:5173`). Multiple origins can be comma-separated.

## Database

Prisma is configured for SQLite by default. Migration commands need a fully-qualified `DATABASE_URL` (absolute path recommended, e.g. `file:/home/.../data/app.db`). Node 22 works when that env var is set; if you hit engine errors, falling back to Node 20 is still a safe option.

```bash
# from repo root
export DATABASE_URL="file:${PWD}/data/app.db"
pnpm --filter @waifu-panel/server exec -- prisma migrate dev --name init
```

After migrations run you can regenerate the client at any time:

```bash
pnpm --filter @waifu-panel/server exec -- prisma generate
```

## Running the Apps

### Backend (Express + Socket.IO)

```bash
pnpm --filter @waifu-panel/server dev
```

Starts on `http://localhost:3000`, serving REST endpoints:

- `POST /api/submissions` — submission intake with lightweight cookie tracking.
- `GET /api/submissions/status/:id` — submission status.
- `GET /api/characters/queue` — current queue snapshot.
- `POST /api/moderation/:characterId` — approve/reject/skip.
- `POST /api/rounds/start` — begin a round.
- `POST /api/rounds/end` — end a round.

### Frontend (React app)

```bash
pnpm --filter @waifu-panel/web dev
```

Launches Vite on `http://localhost:5173`. The submission page is wired to the API (`VITE_API_BASE_URL` defaults to `http://localhost:3000`). Submission flow currently expects an image URL placeholder; upload support arrives later.

## Build & Test

```bash
pnpm -r build
pnpm -r test        # placeholder; no tests yet
```

## Useful Docs

- `docs/architecture.md` — overall system design.
- `docs/data-model.md` — schema plan.
- `docs/realtime-events.md` — socket contracts.
- `docs/deployment.md` — Docker & ops notes.

## Roadmap

- Implement live Socket.IO events and front-end data flows.
- Image upload storage driver (local + cloud).
- Moderator authentication + more robust queue controls.
- Desktop packaging (Electron/Tauri) for show-day convenience.
