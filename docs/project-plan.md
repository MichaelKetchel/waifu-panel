# Waifu Panel Project Plan

Last updated: 2026-05-02

## Purpose

Waifu Panel is a local-first web app for a live convention panel. Attendees submit characters with images, moderators approve and order the queue, a control deck starts live voting rounds, audience devices cast votes, and a projector display shows the current character and live tallies.

The practical goal is a reliable show-day tool first. Cloud deployment, desktop packaging, and richer integrations should come after the core local flow is solid.

## Current Baseline

- Monorepo with `apps/server`, `apps/web`, and `packages/shared`.
- Server uses Express, Socket.IO, Prisma, and SQLite.
- Web uses React, Vite, React Router, and TanStack Query.
- Implemented flows include submission intake, image upload or URL fallback, submitter cookies, submitter-specific submission history, queue snapshots, moderation actions, round start/end, current-round fetch, vote submission, and live queue/round/vote broadcasts.
- Control auth exists for REST routes through a passcode-backed cookie.
- The control socket namespace now uses the same passcode-backed cookie boundary as REST control routes.
- Socket namespaces publish `state:init` snapshots for reconnect hydration and still support narrower queue/round events.
- Queue movement is available through REST and a control socket event.
- Public display/audience queue snapshots only expose approved upcoming submissions.
- Rejected submissions are retained with optional rejection reasons for the submitting client and do not count against the active submission limit.
- The built web app is served by the server when `apps/web/dist` exists.
- Docker packaging exists through `Dockerfile` and `docker-compose.yml`.
- `packages/shared` now contains the frontend-facing queue, round, tally, and snapshot contracts.
- The server exposes public runtime config through `/api/config/public`; the frontend consumes frontend/backend base URLs from that config for REST, uploads, sockets, and generated links.
- Frontend route paths live in a shared web route resolver; the Display page QR code targets the audience voting route through that resolver.

## Verified State

- `pnpm install --frozen-lockfile` succeeds after dependency postinstall scripts can run.
- `pnpm setup` installs dependencies and generates Prisma Client.
- Server build/test scripts generate Prisma Client before running.
- Server runtime and Prisma scripts default `DATABASE_URL` to local SQLite at `apps/data/app.db` when no env file is present.
- `pnpm build` passes.
- `pnpm test` passes.
- `pnpm lint` passes.
- `docker compose config` passes.
- Docker daemon startup was fixed by moving NetworkManager's `docker0` connection into firewalld's `docker` zone instead of `trusted`/`public`.
- `docker compose build` passes.
- `docker compose up -d` starts the app, runs migrations, and serves the app on port 3000.
- Production server smoke test passes when started with a migrated SQLite database: `/healthz`, `/`, and `/api/characters/queue` respond as expected.
- Compose smoke test passes for `/healthz`, `/`, `/control`, `/display`, `/audience`, `/api/characters/queue`, and control auth.
- Node in the inspected environment was `v22.22.2`; docs recommend Node 20 for database tasks.
- Focused web build/lint passes after replacing Control Deck blocking prompts with in-app dialogs.
- `pnpm test` and `pnpm lint` pass after the server-owned public config and Display QR work.
- `pnpm --filter @waifu-panel/shared build` and `pnpm --filter @waifu-panel/web build` pass after the server-owned public config and Display QR work.
- Server build passes with Prisma Client owning `Character.rejectionReason` after regenerating Prisma artifacts outside the sandbox.
- Smoke-tested submitter history, public queue visibility, rejection reason persistence, rejection limit restoration, and manual delete endpoint on a local server.

## Documentation Reality

Docs have been partially reconciled, but code remains the source of truth when behavior is unclear.

Known drift and recent reconciliation:

- Completed: architecture docs now mark service worker/offline caching and cloud storage as future work, not implemented behavior.
- Completed: realtime docs now distinguish REST-owned actions from implemented socket events.
- Completed: data model docs now identify the implemented Prisma/SQLite schema and mark users/audit/events/attachments as future work.
- Completed: deployment docs include a practical show-day checklist and local backup guidance.
- Remaining: keep docs in sync as new contracts and tests land.

## Working Guidelines

- Prefer show-day reliability over premature cloud extensibility.
- Align docs with code before treating docs as a contract.
- Keep REST, socket, and shared payload contracts explicit and consistent.
- Make `packages/shared` the source of truth for public API/socket types once contracts stabilize.
- Keep queue and round behavior conservative: only approved characters should be startable, ordering should be deterministic, and skip/end semantics should be unambiguous.
- Every feature that changes show flow should include focused tests around the affected service and API boundary.
- Avoid unrelated refactors while stabilizing the core panel flow.

## Implementation Plan

### Phase 1: Stabilize The Development Baseline

- Completed: setup, database helper, start, build, test, and lint scripts are in place.
- Completed: empty web/shared test suites use `vitest --passWithNoTests`.
- Completed: ESLint has a root config and `pnpm lint` passes.
- Completed: generated JavaScript mirrors under `apps/web/src` were removed.
- Completed: `apps/web/tsconfig.json` uses `noEmit` so `tsc` no longer regenerates source-adjacent JS.
- Completed: README setup/build/test/start instructions were updated.

### Phase 2: Harden The Core Show Flow

- Completed: backend round starts require approved characters.
- Completed: queue reordering rewrites contiguous 1-based positions.
- Completed: control deck exposes up/down queue movement.
- Completed: `end round` and `skip round` are separate; skipped round votes are discarded.
- Completed: moderation no longer overwrites submitted descriptions with rejection/skip reasons.
- Completed: rejection reasons persist separately from descriptions and rejected submissions remain visible to the submitter.
- Completed: manual submission delete endpoint and Control Deck delete action exist for non-live submissions.
- Partially completed: clearer API errors exist for round, queue move, and moderation-not-found paths; broader route consistency still needs review.

### Phase 3: Reconcile Realtime Behavior

- Completed: `state:init` snapshots include queue, active round, upcoming entries, and basic settings.
- Completed: control socket auth matches REST control auth.
- Completed: display/audience/submission realtime snapshots and display queue updates hide unapproved submissions.
- Decide which actions are REST-only, socket-only, or dual-path with acknowledgements.
- Partially completed: queue move has REST and socket paths; submission notifications exist; settings update events do not.
- Throttle live vote progress if needed for venue networks.

### Phase 4: Make Contracts Shared

- Completed: queue, round, tally, and snapshot payload shapes were moved into `packages/shared` for frontend consumption.
- Pending: consider Zod schemas where runtime validation and TypeScript types should stay paired.
- Partially completed: duplicate frontend type definitions were replaced with shared types; backend still has local event payload interfaces in some places.
- Keep database implementation details out of public shared contracts.

### Phase 5: Package For Local Operation

- Completed: the server serves the built frontend when `apps/web/dist` exists.
- Completed: `Dockerfile` and `docker-compose.yml` exist for local show mode.
- Completed: `/healthz` checks database access and queue length.
- Completed: local SQLite/uploads strategy is documented for Docker and local setup.
- Completed: show-day checklist and backup guidance are documented in `docs/deployment.md`.

### Phase 6: UX And Test Coverage

- Add focused service/API tests for submission limits, moderation, queue ordering, round lifecycle, and vote updates.
- Add frontend tests where state transitions are risky, especially control deck and audience voting.
- Check display and control views on projector/mobile-sized layouts before show-day use.
- Completed: Control Deck no longer relies on blocking browser prompts/alerts/confirms for moderator workflows.
- Completed: submitter page shows persistent per-device submissions, thumbnails, status, queue position, remaining slots, and rejection reason.
- Completed: audience voting keeps showing ended-round tallies with percentages until the next round replaces them.
- Completed: display board shows a QR code linking to the audience page using server-owned runtime public config and the frontend route resolver.
- Improve copy and state handling for network loss, reconnects, and duplicate actions.

### Phase 7: Later Extensions

- Cloud storage and Postgres/Supabase support.
- Multi-event support.
- Auth providers beyond a shared passcode.
- Analytics/export features.
- Desktop packaging through Electron or Tauri.
