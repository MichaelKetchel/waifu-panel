# Deployment & Operations

This document outlines how to run the Waifu Panel application locally for panel night and how to deploy it to a VPS with optional Supabase integrations.

## Prerequisites

- Node.js (LTS) and PNPM/Yarn for local development.
- Docker + Docker Compose for packaged deployments.
- Optional: Supabase (Postgres + storage) account and credentials.

## Environment Configuration

All configuration flows through environment variables. A `.env.example` will mirror the following keys:

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | `development` \| `production` | `development` |
| `PORT` | HTTP port for server | `3000` |
| `DATABASE_URL` | SQLite path (`file:./data/app.db`) or Postgres DSN | local SQLite |
| `STORAGE_DRIVER` | `local` \| `s3` | `local` |
| `STORAGE_LOCAL_PATH` | Directory for uploads when `local` | `./data/uploads` |
| `STORAGE_S3_BUCKET` | Bucket name when `s3` | — |
| `STORAGE_S3_REGION` | Region for S3-compatible storage | — |
| `STORAGE_S3_ENDPOINT` | Override endpoint (MinIO/Supabase) | — |
| `STORAGE_S3_KEY` / `STORAGE_S3_SECRET` | Access credentials | — |
| `CONTROL_PASSCODE` | Simple shared secret for the control deck | (generated) |
| `SUBMISSION_LIMIT` | Max submissions per token per event | `3` |
| `SESSION_SECRET` | Cookie signing secret | (required) |

## Local Development Workflow

1. Install dependencies: `pnpm install`.
2. Run database migrations: `pnpm db:migrate`.
3. Start dev servers:
   - `pnpm dev:server` — Express + Socket.IO with auto-reload.
   - `pnpm dev:web` — Vite dev server for React app.
   - `pnpm dev` — concurrently run both.
4. Access the submission page at `http://localhost:5173`, control deck at `http://localhost:5173/control`.

### Offline Simulation

- Use `DATABASE_URL=file:./data/app.db` and `STORAGE_DRIVER=local`.
- Ensure `data/` directory is writable; add it to `.gitignore`.
- Start Node server with `pnpm start:local` (production build) to confirm assets serve without Vite dev server.

## Docker Packaging

The app ships with a multi-stage Dockerfile:

1. **Builder stage** installs dependencies, runs `pnpm build` for both server and client.
2. **Runtime stage** copies the compiled server bundle, static assets, and `node_modules` (production only).

Example `docker build`:

```bash
docker build -t waifu-panel:latest .
```

### docker-compose (Local Show Mode)

```yaml
services:
  panel:
    image: waifu-panel:latest
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      DATABASE_URL: file:/data/app.db
      STORAGE_DRIVER: local
      STORAGE_LOCAL_PATH: /data/uploads
      SESSION_SECRET: change-me
      CONTROL_PASSCODE: secret-pass
    volumes:
      - ./data:/data
```

This mounts a persistent volume for the SQLite database and uploaded images, ensuring the panel can restart without losing data.

## VPS Deployment

1. Provision a small VM (1–2 vCPU, 1–2 GB RAM is enough).
2. Install Docker + Compose.
3. Copy `.env` and `docker-compose.prod.yml` to the server.
4. Run `docker compose up -d --build`.

### Reverse Proxy

Use Caddy or Nginx to provide HTTPS:

```caddy
waifupanel.example.com {
  reverse_proxy panel:3000
}
```

Update DNS to point to the VPS and ensure ports 80/443 are open.

## Supabase Integration

- Set `DATABASE_URL` to the Supabase Postgres connection string.
- Set `STORAGE_DRIVER=s3` and use Supabase Storage S3-compatible credentials.
- Optional: integrate Supabase Auth by issuing JWTs to control deck users (future enhancement).

## Operational Tips

- **Backups**: For SQLite, schedule a cron job to copy `/data/app.db` and `/data/uploads`. For Postgres, rely on Supabase backups or `pg_dump`.
- **Monitoring**: Expose minimal health endpoint (`/healthz`) returning uptime and queue length. Consider hooking into UptimeRobot.
- **Scaling**: Single instance suffices. If horizontal scaling is needed, implement a shared Socket.IO adapter (Redis) and store sessions in Redis as well.
- **Show-Day Checklist**:
  - Test projector display and control deck on actual hardware.
  - Preload queue by approving a few submissions.
  - Verify offline fallback by briefly disabling network.
  - Keep a backup laptop with the Docker image and data volume synced.

