# Data Model

The application uses a Prisma-managed relational schema configured for SQLite today. Postgres compatibility is a future extension, not an implemented deployment target.

## Implementation Status

Implemented tables: `Submitter`, `Character`, `Round`, `Vote`, `QueuePosition`, and `Setting`.

Future tables/fields discussed below, such as control `users`, richer audit logs, events, and attachments, are roadmap items unless they already appear in `apps/server/prisma/schema.prisma`.

## Entities

### submitters

| Column        | Type        | Notes                                                      |
|---------------|-------------|------------------------------------------------------------|
| `id`          | UUID        | Primary key.                                               |
| `token`       | string      | Random cookie token, unique, indexed.                      |
| `email`       | string?     | Optional future auth. Unique when present.                 |
| `alias`       | string?     | Optional display name for moderation.                      |
| `created_at`  | timestamp   | Default `now()`.                                           |
| `updated_at`  | timestamp   | Updated via trigger or application code.                   |

Use the `token` to identify anonymous guests and enforce submission/vote limits.

### characters

| Column         | Type           | Notes                                                                           |
|----------------|----------------|---------------------------------------------------------------------------------|
| `id`           | UUID           | Primary key.                                                                    |
| `submitter_id` | UUID           | FK → `submitters.id` (nullable if imported/admin-added).                        |
| `name`         | string         | Character name.                                                                 |
| `series`       | string?        | Optional series/franchise metadata.                                             |
| `description`  | text?          | Optional blurb provided by submitter.                                          |
| `image_path`   | string         | Path or URL to stored image.                                                    |
| `status`       | enum           | `queued`, `approved`, `rejected`, `live`, `archived`.                           |
| `tags`         | string?        | Optional metadata for filtering.                                               |
| `created_at`   | timestamp      | Default `now()`.                                                                |
| `updated_at`   | timestamp      | Updated whenever moderation status changes.                                     |
| `moderated_by` | UUID?          | FK → `users.id` (control panel admins).                                         |
| `moderated_at` | timestamp?     | When approval/rejection occurred.                                              |

Consider adding an index on `(status, created_at)` for queue fetching.

### rounds

Represents a live segment where a character is open for voting.

| Column        | Type         | Notes                                                    |
|---------------|--------------|----------------------------------------------------------|
| `id`          | UUID         | Primary key.                                             |
| `character_id`| UUID         | FK → `characters.id`. Unique to prevent overlapping.     |
| `mode`        | enum         | `yn` or `scale`.                                         |
| `scale_min`   | smallint     | Default 1 (for `scale` mode).                            |
| `scale_max`   | smallint     | Default 5.                                               |
| `started_at`  | timestamp    | Set when round begins.                                   |
| `ended_at`    | timestamp?   | Null until the round is closed.                          |

Past rounds remain archived to allow analytics.

### votes

| Column         | Type       | Notes                                                           |
|----------------|------------|-----------------------------------------------------------------|
| `id`           | UUID       | Primary key.                                                    |
| `round_id`     | UUID       | FK → `rounds.id`. Indexed.                                      |
| `submitter_id` | UUID?      | FK → `submitters.id`. Null if user not logged in.               |
| `anon_token`   | string?    | Random token stored in cookie for anonymous voters.            |
| `value`        | smallint   | Either `0/1` for yes/no or range value for 1–5 scale.           |
| `created_at`   | timestamp  | Default `now()`.                                                |
| `client_meta`  | string?    | Optional device info or session identifiers (hashed).          |

Add a unique constraint on `(round_id, submitter_id)` and `(round_id, anon_token)` to avoid duplicates when identity is known.

### queue_positions

Maintains ordering for moderation and presentation.

| Column        | Type     | Notes                                                        |
|---------------|----------|--------------------------------------------------------------|
| `id`          | UUID     | Primary key.                                                 |
| `character_id`| UUID     | FK → `characters.id`. Unique.                                |
| `position`    | integer  | Sort order within queue. Indexed.                            |
| `inserted_at` | timestamp| For tie-breaking and audit.                                   |

This table allows drag-and-drop reordering without overloading the `characters` table.

### users (control admins)

For moderators and panel operators. Not implemented today; the control deck currently uses a shared passcode and signed cookie.

| Column       | Type      | Notes                                   |
|--------------|-----------|-----------------------------------------|
| `id`         | UUID      | Primary key.                            |
| `email`      | string    | Unique.                                 |
| `password`   | string?   | Optional if using passphrase login.     |
| `role`       | enum      | `admin`, `moderator`.                   |
| `created_at` | timestamp |                                         |

Initial implementation might use a single shared passphrase stored in configuration instead of this table. Add later as needed.

### settings

Key/value configuration persisted in the database.

| Column      | Type     | Notes                                                                 |
|-------------|----------|-----------------------------------------------------------------------|
| `key`       | string   | Primary key.                                                          |
| `value`     | string   | Flexible payload stored as serialized text.                           |
| `updated_at`| timestamp| Track configuration changes.                                          |

Use this to store submission limits, vote mode defaults, and show-day toggles.

## Relationships Diagram (text)

```
submitters 1─┬─∞ characters
             └─∞ votes

characters 1─1 queue_positions
characters 1─∞ rounds

rounds 1─∞ votes
```

## Indexing & Performance Notes

- Index `characters(status, created_at)` for queue queries.
- Index `queue_positions(position)` to support sorting.
- Composite indexes on `votes(round_id, created_at)` for quick tally aggregation.
- When on Postgres, consider materialized view / cached aggregates for live tallies.

## Future Extensions

- **events table**: supports multiple panel instances with start/end times.
- **attachments table**: handle multiple images or media per submission.
- **audit logs**: record moderation actions for transparency.
- **rate_limit buckets**: track per-submitter or per-IP counts for flexible policies.
