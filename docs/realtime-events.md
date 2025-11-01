# Realtime Events

Socket.IO coordinates live updates between the control deck, display board, submission portal, and audience voting clients. All events use JSON payloads with camelCased keys and share TypeScript definitions in `packages/shared`.

## Namespaces

- `/control` — Moderators/panel operators.
- `/display` — Projector-only read-only feed.
- `/audience` — Voting interface for attendees.
- `/submission` — Submission portal updates (optional).

Clients authenticate by passing a short-lived JWT or shared passphrase token in the handshake query (control namespace) and the `submitter_token` cookie for audience/submission namespaces.

## Event Catalogue

### Server → Client

| Event                    | Namespace(s)        | Payload                                        | Description |
|--------------------------|---------------------|------------------------------------------------|-------------|
| `state:init`             | control, display    | `StateSnapshot`                                | Sent on connect to hydrate with current queue, live round, settings. |
| `queue:updated`          | control, display    | `{ queue: QueueEntry[] }`                      | Updated order/status of characters. |
| `submission:received`    | control             | `{ submissionId: string, character: CharacterSummary }` | Notifies moderators of new submissions. |
| `round:started`          | control, display, audience | `{ round: RoundDetail }`                 | Announces active character and voting mode. |
| `round:ended`            | control, display, audience | `{ roundId: string, finalTallies: VoteTallies }` | Signals end of voting and provides final counts. |
| `vote:progress`          | control, display    | `{ roundId: string, tallies: VoteTallies }`    | High-frequency updates (throttled). |
| `character:skipped`      | control, display, audience | `{ characterId: string, reason?: string }` | Indicates a character was skipped mid-round. |
| `settings:updated`       | control, display, audience, submission | `{ settings: SettingsPayload }` | Broadcast when configuration changes. |
| `error`                  | all                 | `{ code: string, message: string }`            | Standardized error reporting. |

### Client → Server

| Event                 | Namespace      | Payload                                              | Notes |
|-----------------------|----------------|------------------------------------------------------|-------|
| `control:queue:move`  | control        | `{ characterId: string, position: number }`         | Reorders queue. |
| `control:round:start` | control        | `{ characterId: string, mode?: VoteMode }`          | Launches a round and notifies others. |
| `control:round:end`   | control        | `{ roundId: string }`                               | Closes the current round. |
| `control:moderate`    | control        | `{ characterId: string, action: 'approve'|'reject'|'skip' }` | Moderation decisions. |
| `audience:vote`       | audience       | `{ roundId: string, value: number }`                | Submit or update a vote. |
| `submission:new`      | submission     | `{ tempId: string }` (ack-only)                     | Used to confirm receipt before REST response completes in slow networks. |
| `submission:cancel`   | submission     | `{ submissionId: string }`                          | Allows user to retract before moderation. |

### Acknowledgements

- Critical events (`control:round:start`, `audience:vote`) expect acknowledgement to confirm persistence. Failure triggers client-side retry with exponential backoff.
- Broadcasting events (`vote:progress`) are fire-and-forget but throttled (e.g., max 5 updates/second) to keep bandwidth manageable.

## Payload Interfaces

Informal TypeScript-like definitions (final versions live in `packages/shared/types.ts`):

```ts
type VoteMode = 'yn' | 'scale';

interface CharacterSummary {
  id: string;
  name: string;
  series?: string;
  imageUrl: string;
  submitterAlias?: string;
}

interface QueueEntry {
  character: CharacterSummary;
  position: number;
  status: 'queued' | 'approved' | 'live';
}

interface RoundDetail {
  id: string;
  character: CharacterSummary;
  mode: VoteMode;
  scale?: { min: number; max: number };
  startedAt: string;
}

interface VoteTallies {
  roundId: string;
  totals: Record<string, number>; // e.g. { yes: 42, no: 12 } or { '1': 3, '2': 1, ... }
}

interface StateSnapshot {
  queue: QueueEntry[];
  activeRound?: RoundDetail & { tallies: VoteTallies['totals'] };
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
- **Versioning**: Include `schemaVersion` in snapshots to detect incompatible client builds.
- **Rooms**: Use Socket.IO rooms keyed by `roundId` to scope vote tallies when multiple events run concurrently (future multi-event support).
- **Compression**: Enable per-message compression but cap payload size by trimming `description` fields from broadcast payloads.

