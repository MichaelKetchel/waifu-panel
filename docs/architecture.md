# Waifu Panel Architecture Overview

## Goals

- Enable a reliable, audience-interactive panel regardless of venue network quality.
- Support a path from fully local operation to optional cloud hosting on a VPS or Supabase.
- Keep implementation modular so future contributors can swap storage, auth, or UI pieces.

## High-Level System

The project is a monorepo with three major parts:

- `apps/server`: Node.js (Express) HTTP API plus Socket.IO real-time hub.
- `apps/web`: React + Vite client packaged for submission, voting, control, and display views.
- `packages/shared`: Shared TypeScript types and utilities consumed by both apps.

> Rationale: Keeping everything in one repository simplifies local-first builds, cross-cutting changes, and Docker packaging.

### Core Modules

- **Submission flow**: REST handlers receive character submissions, apply rate limits using a lightweight cookie (`submitter_token`), and queue items for moderation.
- **Moderation and scheduling**: Control dashboard APIs manage the queue, approve/reject entries, and start/advance rounds.
- **Voting**: Real-time events broadcast the active character, vote prompts, and live tally updates to display and audience clients.
- **Storage abstraction**: Interface-driven layer with implementations for local filesystem + SQLite (default) and optional Supabase Postgres + object storage.

## Runtime Topology

```
Client browsers (submission / audience / control / display)
        │
        │ HTTPS + WebSocket (Socket.IO)
        ▼
Express + Socket.IO server (apps/server)
        │
        ├── SQLite (local) or Postgres (cloud)
        └── Local filesystem storage or S3-compatible bucket
```

The server bundles static assets for the web app during build time, allowing a single container or binary to serve everything.

## Key Design Choices

- **Local-first**: SQLite database and disk-backed file storage ensure the panel runs without reliable internet. Cloud drivers plug in via configuration.
- **Minimal identity**: Cookie-based submitter token enforces per-person limits without requiring social logins. Future auth providers can slot into the auth middleware.
- **Real-time resilience**: Socket.IO namespaces keep audience, control, and display clients in sync. On reconnect, the server sends a state snapshot to avoid stale data.
- **Offline-friendly UI**: React app registers a service worker to cache critical assets and prefetch upcoming character images.
- **Single Docker image**: Both server and frontend compile into one container for straightforward local or VPS deployment.

## Frontend Applications

- **Submission Portal**: Form to upload character details and images, displays submission status and rate-limit feedback.
- **Audience Voting**: Minimal UI showing current character info and vote controls (yes/no or 1–5 scale).
- **Display Board**: Projector-friendly view of the active character with live vote tallies and optional queue preview.
- **Control Deck**: Moderator tool showing current/next characters, moderation actions, vote mode toggles, and queue management.

Shared components (cards, vote widgets, timers) live in the web app but use shared types for compile-time guarantees with the backend.

## Backend Services

- **Express API**:
  - `POST /api/submissions` — handle new character submissions.
  - `GET /api/characters/queue` — deliver current queue to control deck.
  - `POST /api/moderation/{approve|reject|skip}` — control deck actions.
  - `POST /api/rounds/start` — start a live round and notify clients.
- **Socket.IO Events** (detailed in `docs/realtime-events.md`):
  - Submission notifications, queue updates, round lifecycle, live vote tallies.
- **Background tasks**:
  - Optional sync job to push locally stored assets to cloud buckets.
  - Periodic cleanup of old submissions and votes.

## Extensibility Roadmap

- **Auth providers**: Add magic-link or OAuth by swapping the authentication middleware and extending the `submitters` table.
- **Multi-event support**: Introduce an `events` table, segmenting submissions and votes per panel instance.
- **Desktop packaging**: Wrap the web client and Node server in Electron/Tauri for a fully self-contained show-day app.
- **Analytics exports**: Add reports summarizing submissions, votes, and engagement per event.

## Related Documents

- [`docs/data-model.md`](./data-model.md) — database schema and entity relationships.
- [`docs/realtime-events.md`](./realtime-events.md) — API/event contracts for Socket.IO.
- [`docs/deployment.md`](./deployment.md) — Docker setup, configuration, and operations.

