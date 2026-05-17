# Data Model — SMP Karting Race Control

Database: SQLite (file `smp_karting.db`)  
ORM: SQLAlchemy 2.x (async)  
Migrations: Alembic (see `server/app/db/migrations/`)

All timestamps are stored as UTC with timezone info.  
Foreign keys are enforced via `PRAGMA foreign_keys = ON` (set per connection).

---

## Entity Relationship Overview

```
Race ──< Post ──< UserPost >── User ──── UserInvite
 │
 └──< Incident ──── AudioFile
          │
          └──── Decision
          │
          └──── ProtocolEntry
```

---

## Table Definitions

### `races`

Represents a single karting race event.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `name` | VARCHAR(200) | NOT NULL | e.g. "Round 3 Senior Class" |
| `venue` | VARCHAR(200) | NOT NULL | e.g. "Moscow Kart Center" |
| `scheduled_at` | DATETIME (tz) | NOT NULL | Planned race start time |
| `status` | VARCHAR(20) | NOT NULL, default `draft` | Enum: `draft`, `active`, `finished`, `archived` |
| `created_at` | DATETIME (tz) | NOT NULL, server default now | |
| `updated_at` | DATETIME (tz) | NOT NULL, server default now, on update now | |

**Status transitions**: `draft` → `active` → `finished` → `archived`  
Only the organizer (admin role) may change status.

---

### `posts`

A fixed observation post at a specific point on the track.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `race_id` | INTEGER | FK → `races.id` CASCADE DELETE, NOT NULL | |
| `label` | VARCHAR(50) | NOT NULL | Short label shown in UI, e.g. "T3", "Sector B" |
| `map_x` | INTEGER | nullable | Pixel X on track map image for drag-assign UI |
| `map_y` | INTEGER | nullable | Pixel Y on track map image for drag-assign UI |

**Note**: posts are scoped to a race (not reused across races) so track layouts can vary per event.

---

### `users`

All human participants in a race. No passwords are stored.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `name` | VARCHAR(100) | NOT NULL | Full name |
| `role` | VARCHAR(20) | NOT NULL | Enum: `admin`, `marshal`, `judge`, `secretary` |
| `race_id` | INTEGER | FK → `races.id` CASCADE DELETE, NOT NULL | Users are scoped to one race per row |
| `session_token` | VARCHAR(128) | nullable, indexed | Opaque token issued after invite redemption; grants access to the system |
| `is_active` | BOOLEAN | NOT NULL, default `true` | Organizer can deactivate a user mid-race |
| `created_at` | DATETIME (tz) | NOT NULL, server default now | |

**Design note**: a person who participates in multiple races has one `users` row per race. This keeps auth scope simple: a session token from Race 1 does not grant access to Race 2.

---

### `user_invites`

One-time invite tokens; one per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `user_id` | INTEGER | FK → `users.id` CASCADE DELETE, UNIQUE | One invite per user |
| `token` | VARCHAR(128) | UNIQUE, NOT NULL, indexed | URL-safe random 32-byte token |
| `expires_at` | DATETIME (tz) | NOT NULL | Default: 72 hours after creation |
| `redeemed_at` | DATETIME (tz) | nullable | NULL = not yet redeemed |
| `created_at` | DATETIME (tz) | NOT NULL, server default now | |

**Redemption logic**: on redeem, set `redeemed_at = now()` and write `session_token` to the parent `users` row. Subsequent redemption attempts return HTTP 409.

---

### `user_posts`

Assignment of a marshal to a track post (many-to-many junction, in practice one-to-one per race).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `user_id` | INTEGER | FK → `users.id` CASCADE DELETE | Must have role `marshal` (enforced at service layer) |
| `post_id` | INTEGER | FK → `posts.id` CASCADE DELETE | |
| `assigned_at` | DATETIME (tz) | NOT NULL, server default now | |

---

### `incidents`

The core event record. Created when a marshal uploads audio; status advances through the workflow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `race_id` | INTEGER | FK → `races.id` CASCADE DELETE, NOT NULL | |
| `post_id` | INTEGER | FK → `posts.id`, NOT NULL | The post from which the report originated |
| `marshal_id` | INTEGER | FK → `users.id`, NOT NULL | Marshal who filed the report |
| `transcript_raw` | TEXT | nullable | Verbatim Whisper output |
| `pilot_numbers` | VARCHAR(100) | nullable | Comma-separated extracted pilot numbers, e.g. `"7,23"` |
| `violation_type` | VARCHAR(30) | nullable | Enum: `collision`, `track_limits`, `false_start`, `unsafe_driving`, `blocking`, `other` |
| `free_text` | TEXT | nullable | Remainder of transcript after NLP extraction |
| `status` | VARCHAR(30) | NOT NULL, default `pending_confirm` | See status flow below |
| `is_emergency` | BOOLEAN | NOT NULL, default `false` | Triggers broadcast to all channels |
| `reported_at` | DATETIME (tz) | NOT NULL, server default now | When audio was uploaded |
| `confirmed_at` | DATETIME (tz) | nullable | When marshal confirmed the transcript |

**Status flow**:
```
pending_confirm  →  confirmed  →  decided
                                  dismissed
```

- `pending_confirm`: audio uploaded, marshal reviewing transcript on phone
- `confirmed`: marshal confirmed, incident card delivered to judge
- `decided`: judge issued a decision
- `dismissed`: judge dismissed without decision

---

### `decisions`

Exactly one decision per confirmed incident.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `incident_id` | INTEGER | FK → `incidents.id` CASCADE DELETE, UNIQUE | |
| `judge_id` | INTEGER | FK → `users.id`, NOT NULL | Judge who issued the decision |
| `decision_type` | VARCHAR(20) | NOT NULL | Enum: `penalty`, `warning`, `dismiss` |
| `penalty_detail` | VARCHAR(200) | nullable | Human-readable penalty, e.g. "+5 seconds", "drive-through" |
| `notes` | TEXT | nullable | Judge's optional written reasoning |
| `decided_at` | DATETIME (tz) | NOT NULL, server default now | |

---

### `protocol_entries`

Denormalized, append-only audit log written after each decision. Safe to export at any time even if upstream records change.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `incident_id` | INTEGER | FK → `incidents.id` CASCADE DELETE, UNIQUE | |
| `race_id` | INTEGER | FK → `races.id`, NOT NULL | |
| `sequence_number` | INTEGER | NOT NULL | Monotonically increasing per race (1, 2, 3…) |
| `pilot_numbers` | VARCHAR(100) | NOT NULL | Snapshot at time of decision |
| `violation_type` | VARCHAR(50) | NOT NULL | Snapshot |
| `decision_type` | VARCHAR(50) | NOT NULL | Snapshot |
| `penalty_detail` | VARCHAR(200) | nullable | Snapshot |
| `post_label` | VARCHAR(50) | NOT NULL | Snapshot of `posts.label` |
| `marshal_name` | VARCHAR(100) | NOT NULL | Snapshot of `users.name` |
| `judge_name` | VARCHAR(100) | NOT NULL | Snapshot of `users.name` |
| `created_at` | DATETIME (tz) | NOT NULL, server default now | |

**Design note**: Snapshots are intentional. If a post label or user name is corrected after the fact, the protocol entry remains accurate to what was true at decision time. This matters for race appeals.

---

### `audio_files`

Metadata for audio recordings stored on disk.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | |
| `incident_id` | INTEGER | FK → `incidents.id` CASCADE DELETE, UNIQUE | One audio file per incident |
| `file_path` | VARCHAR(500) | NOT NULL | Path relative to `AUDIO_STORAGE_DIR`, e.g. `1/incident_42.ogg` |
| `format` | VARCHAR(10) | NOT NULL, default `ogg` | Storage format after conversion |
| `duration_seconds` | REAL | nullable | Detected by ffprobe after storage |
| `file_size_bytes` | INTEGER | nullable | Size of stored file |
| `created_at` | DATETIME (tz) | NOT NULL, server default now | |

**Storage layout** on disk:
```
audio_storage/
  {race_id}/
    incident_{incident_id}.ogg
```

---

## Indexes

Beyond primary keys and the explicit `UNIQUE` constraints above, the following indexes support common query patterns:

| Table | Column(s) | Reason |
|-------|-----------|--------|
| `users` | `session_token` | WebSocket auth lookup on every connection |
| `user_invites` | `token` | Invite redemption lookup |
| `incidents` | `race_id` | List incidents for a race |
| `incidents` | `status` | Filter pending/confirmed/decided |
| `protocol_entries` | `race_id, sequence_number` | Ordered export |

---

## Enum Reference

| Enum | Values |
|------|--------|
| `RaceStatus` | `draft`, `active`, `finished`, `archived` |
| `UserRole` | `admin`, `marshal`, `judge`, `secretary` |
| `ViolationType` | `collision`, `track_limits`, `false_start`, `unsafe_driving`, `blocking`, `other` |
| `IncidentStatus` | `pending_confirm`, `confirmed`, `decided`, `dismissed` |
| `DecisionType` | `penalty`, `warning`, `dismiss` |
