# Deployment & Operations

This document outlines how to run the Waifu Panel application locally for panel night. VPS, Postgres, and cloud storage notes are roadmap guidance unless called out as implemented.

## Prerequisites

- Node.js 20.x and PNPM for local development.
- Docker + Docker Compose for packaged deployments.

## Environment Configuration

All configuration flows through environment variables. A `.env.example` will mirror the following keys:

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | `development` \| `production` | `development` |
| `PORT` | HTTP port for server | `3000` |
| `DATABASE_URL` | SQLite path | `file:../../data/app.db` for local scripts/server runtime |
| `STORAGE_DRIVER` | Storage backend; only `local` is implemented today | `local` |
| `STORAGE_LOCAL_PATH` | Directory for uploads when `local` | `./data/uploads` |
| `PUBLIC_BASE_URL` | Optional absolute base URL for generated upload links | unset |
| `CONTROL_PASSCODE` | Simple shared secret for the control deck | unset |
| `SUBMISSION_LIMIT` | Max submissions per token per event | `3` |
| `SESSION_SECRET` | Cookie signing secret; set a non-default value for show mode | `waifu-panel` fallback |
| `CORS_ORIGIN` | Comma-separated frontend origins for dev mode | unset |

## Local Development Workflow

1. Install dependencies and generate Prisma Client: `pnpm setup`.
2. Run database migrations: `pnpm db:migrate -- --name init`. This uses `apps/data/app.db` unless `DATABASE_URL` is set.
3. Start dev servers:
   - `pnpm dev:server` — Express + Socket.IO with auto-reload.
   - `pnpm dev:web` — Vite dev server for React app.
   - `pnpm dev` — concurrently run both.
   - `pnpm dev:lan` — run migrations, bind Vite to the LAN, and configure frontend API/socket URLs for other devices.
4. Access the submission page at `http://localhost:5173`, audience page at `/audience`, display at `/display`, and control deck at `/control`.

### Offline Simulation

- Use `DATABASE_URL=file:./data/app.db` and `STORAGE_DRIVER=local`.
- Ensure `data/` directory is writable; add it to `.gitignore`.
- Start Node server with `pnpm build && pnpm start` to confirm assets serve without Vite dev server.

## Docker Packaging

The app ships with a multi-stage `Dockerfile`:

1. **Builder stage** installs dependencies, runs `pnpm build` for both server and client.
2. **Runtime stage** copies the compiled server bundle, static assets, and `node_modules` (production only).

Example `docker build`:

```bash
docker build -t waifu-panel:latest .
```

### Docker Compose (Local Show Mode)

The checked-in `docker-compose.yml` runs migrations on startup and persists SQLite/uploads under `./data`:

```yaml
services:
  panel:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: file:/data/app.db
      STORAGE_DRIVER: local
      STORAGE_LOCAL_PATH: /data/uploads
      SESSION_SECRET: change-me
      CONTROL_PASSCODE: let-me-in
    volumes:
      - ./data:/data
    command: sh -c "pnpm db:deploy && pnpm start"
```

This mounts a persistent volume for the SQLite database and uploaded images, ensuring the panel can restart without losing data.

## VPS Deployment

1. Provision a small VM (1–2 vCPU, 1–2 GB RAM is enough).
2. Install Docker + Compose.
3. Copy `.env` and `docker-compose.yml` to the server, or provide equivalent environment variables through the host.
4. Run `docker compose up -d --build`.

### Reverse Proxy

Use Caddy or Nginx to provide HTTPS:

```caddy
waifupanel.example.com {
  reverse_proxy panel:3000
}
```

Update DNS to point to the VPS and ensure ports 80/443 are open.

## Future Cloud Integrations

Postgres, S3-compatible storage, Supabase, and external auth are not wired into the current code. Add these only after the local SQLite/upload flow remains stable under show-day testing.

## Operational Tips

- **Backups**: Copy `./data/app.db` and `./data/uploads` before the show, after rehearsal, and after the panel.
- **Monitoring**: Check `/healthz`; it returns uptime, database status, and queue length.
- **Scaling**: Run one instance. Multi-instance Socket.IO/session support is not implemented.

## Show-Day Checklist

1. Before travel, run `pnpm build`, `pnpm test`, `pnpm lint`, and `docker compose build`.
2. Set non-default `SESSION_SECRET` and `CONTROL_PASSCODE`.
3. Set `CORS_ORIGIN` to every dev frontend origin if running Vite; Compose show mode on port 3000 usually does not need it.
4. Start show mode with `docker compose up -d` and verify `http://localhost:3000/healthz`.
5. Open `/control`, log in, and verify queue movement, approve/reject/skip, start, end, and skip-round controls.
6. Open `/display` on the projector machine and `/audience` on at least one phone.
7. Submit a few test characters, approve them, start both Yes/No and 1-5 rounds, and confirm live tallies update.
8. Back up `./data` after rehearsal content is loaded.
9. Keep a second browser/device logged into the control deck and keep a copy of the Compose image plus `./data` on a backup laptop.
