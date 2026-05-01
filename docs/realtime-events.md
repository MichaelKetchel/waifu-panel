# Realtime Events

Socket.IO coordinates live updates between the control deck, display board, submission portal, and audience voting clients. All events use JSON payloads with camelCased keys. Public payload shapes are moving into `packages/shared`; some backend event internals still use local interfaces.

## Namespaces

- `/control` — Moderators/panel operators.
- `/display` — Projector-only read-only feed.
- `/audience` — Voting interface for attendees.
- `/submission` — Submission portal updates.

The `/control` namespace requires the signed control cookie created by `POST /api/auth/control`. The display, audience, and submission namespaces are currently open on the local network.

## Event Catalogue

### Server → Client

| Event                    | Namespace(s)        | Payload                                        | Description |
|--------------------------|---------------------|------------------------------------------------|-------------|
| `state:init`             | control, display, audience; submission by request | `StateSnapshot` | Hydrates clients with queue, active round, upcoming entries, and basic settings. |
| `queue:updated`          | control, display    | `{ queue: QueueEntry[] }`                      | Updated order/status of characters. |
| `submission:received`    | control             | `{ submissionId: string, character: CharacterSummary }` | Notifies moderators of new submissions. |
| `submission:welcome`     | submission          | `{ message: string }`                          | Confirms the submission socket connected. |
| `round:started`          | control, display, audience | `{ round: RoundDetail }`                 | Announces active character and voting mode after REST start. |
| `round:ended`            | control, display, audience | `{ roundId: string, tallies: VoteTallies }` | Signals end of voting and provides final counts. |
| `vote:progress`          | control, display, audience | `{ roundId: string, tallies: VoteTallies }` | Broadcast after vote changes. |
| `character:skipped`      | control, display, audience | `{ characterId: string, roundId?: string, reason?: string }` | Indicates a queued character or live round was skipped. |
| `error`                  | all                 | `{ code: string, message: string }`            | Standardized error reporting. |

### Client → Server

| Event                 | Namespace      | Payload                                              | Notes |
|-----------------------|----------------|------------------------------------------------------|-------|
| `state:request`       | all            | none                                                 | Server replies with `state:init`. |
| `queue:fetch`         | control        | none                                                 | Server replies with `queue:updated`. |
| `control:queue:move`  | control        | `{ characterId: string, position: number }`          | Reorders queue and supports acknowledgement. REST `PATCH /api/characters/queue/:characterId` is the UI path. |

Round start/end/skip, moderation, submission intake, and votes are currently REST-owned actions that broadcast socket updates after persistence.

### Acknowledgements

- `control:queue:move` supports an optional acknowledgement `{ ok: boolean, message?: string }`.
- Broadcasting events are fire-and-forget. Vote progress is not throttled yet.

## Payload Interfaces

Informal TypeScript-like definitions. The canonical exported types live in `packages/shared/src/index.ts`.

```ts
type VoteMode = 'yn' | 'scale';
type CharacterStatus = 'queued' | 'approved' | 'rejected' | 'live' | 'archived';

interface CharacterSummary {
  id: string;
  name: string;
  series: string | null;
  imagePath: string;
  submitterAlias?: string | null;
  status?: CharacterStatus;
}

interface QueueEntry {
  id: string;
  position: number;
  status: CharacterStatus;
  name: string;
  series: string | null;
  imagePath: string;
}

interface RoundDetail {
  id: string;
  character: CharacterSummary;
  mode: VoteMode;
  scale?: { min: number; max: number };
  startedAt: string;
}

interface VoteTally {
  value: number;
  count: number;
}

interface VoteTallies {
  roundId: string;
  tallies: VoteTally[];
}

interface RoundState {
  id: string;
  character: CharacterSummary;
  mode: VoteMode;
  scale: { min: number; max: number };
  startedAt: string;
  tallies: VoteTally[];
  status: 'live' | 'ended';
}

interface StateSnapshot {
  schemaVersion: number;
  queue: QueueEntry[];
  activeRound: RoundState | null;
  upcoming: CharacterSummary[];
  settings: SettingsPayload;
}

interface SettingsPayload {
  submissionLimit: number;
  voteModeDefault: VoteMode;
  requirePasscode: boolean;
}
```

## Reliability Considerations

- **Reconnects**: Clients emit `state:request` if they miss updates; server replies with `state:init`.
- **Versioning**: `state:init` snapshots include `schemaVersion`.
- **Future multi-event support**: Rooms keyed by event or round would be needed for concurrent panels.
- **Future bandwidth controls**: Throttle `vote:progress` if venue networks struggle.
