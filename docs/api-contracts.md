# API Contracts — SMP Karting Race Control

> Version: 0.1.0  
> Base URL (REST): `http://<server-ip>:8000/api/v1`  
> Base URL (WebSocket): `ws://<server-ip>:8000/ws`  
> Network: local Wi-Fi only. No internet dependency.

---

## Authentication

There are **no passwords** in this system. Access is granted via a one-time invite token.

### Flow

```
Organizer creates user  →  POST /users/
Server generates invite →  POST /users/{id}/invite  →  returns { invite_url, qr_code_url }
Organizer shows QR code to marshal
Marshal scans QR on phone, app calls  →  POST /users/invite/redeem  →  returns { session_token, user }
session_token is stored in localStorage and sent as header X-Session-Token on all subsequent calls
WebSocket connections pass token as query param:  ws://.../ws/{channel}?token={session_token}
```

### X-Session-Token header

All API requests from authenticated clients include:

```
X-Session-Token: <opaque 32-byte URL-safe token>
```

Judges and secretaries receive their session tokens out-of-band from the organizer (direct copy-paste for MVP; QR flow is identical to marshals).

---

## REST Endpoints

### Races

#### `POST /races/`
Create a new race.

**Request body**
```json
{
  "name": "Round 3 — Senior Class",
  "venue": "Moscow Kart Center",
  "scheduled_at": "2025-08-10T10:00:00Z"
}
```

**Response 201**
```json
{
  "id": 1,
  "name": "Round 3 — Senior Class",
  "venue": "Moscow Kart Center",
  "scheduled_at": "2025-08-10T10:00:00Z",
  "status": "draft",
  "created_at": "2025-08-09T18:00:00Z",
  "posts": []
}
```

---

#### `GET /races/`
List all races, newest first.

**Response 200** — array of Race objects (same shape as above).

---

#### `GET /races/{race_id}`
Get a single race with its posts.

**Response 200** — Race object.  
**Response 404** — `{ "detail": "Race not found" }`

---

#### `PATCH /races/{race_id}`
Update race metadata.

**Request body** (all fields optional)
```json
{
  "name": "Updated Name",
  "venue": "New Venue",
  "scheduled_at": "2025-08-10T11:00:00Z",
  "status": "draft"
}
```

**Response 200** — Updated Race object.

---

#### `POST /races/{race_id}/start`
Transition race from `draft` → `active`.

**Response 200** — Race object with `status: "active"`.  
**Response 400** — if race is not in `draft` status.

---

#### `POST /races/{race_id}/finish`
Transition race from `active` → `finished`.

**Response 200** — Race object with `status: "finished"`.

---

#### `POST /races/{race_id}/posts`
Add a track post to a race.

**Request body**
```json
{
  "label": "T3",
  "map_x": 420,
  "map_y": 310
}
```

**Response 201**
```json
{
  "id": 5,
  "race_id": 1,
  "label": "T3",
  "map_x": 420,
  "map_y": 310
}
```

---

#### `GET /races/{race_id}/posts`
List all posts for a race.

**Response 200** — array of Post objects.

---

#### `PATCH /races/{race_id}/posts/{post_id}`
Update a post (e.g. drag-reposition on map).

**Request body** (all optional)
```json
{ "label": "T3-B", "map_x": 430, "map_y": 315 }
```

**Response 200** — Updated Post object.

---

### Users & Invites

#### `POST /users/`
Create a user for a race.

**Request body**
```json
{
  "name": "Иван Петров",
  "role": "marshal",
  "race_id": 1
}
```

`role` enum: `admin | marshal | judge | secretary`

**Response 201**
```json
{
  "id": 12,
  "name": "Иван Петров",
  "role": "marshal",
  "race_id": 1,
  "is_active": true,
  "created_at": "2025-08-09T18:05:00Z"
}
```

---

#### `GET /users/?race_id={race_id}`
List all users for a race.

**Response 200** — array of User objects.

---

#### `POST /users/{user_id}/invite?base_url={marshal_app_url}`
Generate a one-time invite link + QR code for the user.

`base_url` — URL of the marshal PWA, e.g. `http://192.168.1.100:5174`

**Response 200**
```json
{
  "invite_url": "http://192.168.1.100:5174/join/abc123...",
  "qr_code_url": "data:image/png;base64,iVBORw0KGgo...",
  "expires_at": "2025-08-12T18:05:00Z"
}
```

The QR code encodes `invite_url` and can be displayed directly in the browser as an `<img src>`.

---

#### `POST /users/invite/redeem`
Marshal device calls this after scanning QR / opening invite link.

**Request body**
```json
{ "token": "abc123..." }
```

**Response 200**
```json
{
  "session_token": "xyz789...",
  "user": {
    "id": 12,
    "name": "Иван Петров",
    "role": "marshal",
    "race_id": 1,
    "is_active": true,
    "created_at": "2025-08-09T18:05:00Z"
  }
}
```

**Response 404** — token not found.  
**Response 409** — token already redeemed.  
**Response 410** — token expired.

---

#### `POST /users/assign-post`
Organizer assigns a marshal to a track post.

**Request body**
```json
{ "user_id": 12, "post_id": 5 }
```

**Response 204** — no body.

---

### Incidents

#### `POST /incidents/audio`
Marshal uploads a voice recording. Server runs ASR + NLP and returns structured transcript. The marshal has not confirmed yet; the incident is in `pending_confirm` state.

**Request** — `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `audio` | file | WAV or WebM audio blob |
| `race_id` | int | |
| `post_id` | int | |
| `marshal_id` | int | |
| `is_emergency` | bool | `false` by default |

**Response 201**
```json
{
  "incident_id": 42,
  "transcript_raw": "пилот 7 столкновение на третьем повороте",
  "pilot_numbers": [7],
  "violation_type": "collision",
  "free_text": "на третьем повороте"
}
```

`violation_type` enum: `collision | track_limits | false_start | unsafe_driving | blocking | other | null`

---

#### `POST /incidents/{incident_id}/confirm`
Marshal confirms (possibly edited) transcript. Triggers WebSocket push to judge channel.

**Request body**
```json
{
  "pilot_numbers": [7, 23],
  "violation_type": "collision",
  "free_text": "Turn 3, contact at exit",
  "is_emergency": false
}
```

**Response 200** — full Incident object:
```json
{
  "id": 42,
  "race_id": 1,
  "post_id": 5,
  "marshal_id": 12,
  "transcript_raw": "пилот 7 столкновение...",
  "pilot_numbers": "7,23",
  "violation_type": "collision",
  "free_text": "Turn 3, contact at exit",
  "status": "confirmed",
  "is_emergency": false,
  "reported_at": "2025-08-10T11:23:01Z",
  "confirmed_at": "2025-08-10T11:23:15Z",
  "audio_file_id": 38
}
```

---

#### `POST /incidents/{incident_id}/decide?judge_id={judge_id}`
Judge issues a decision. Creates a `Decision` + `ProtocolEntry`, notifies secretary.

**Request body**
```json
{
  "decision_type": "penalty",
  "penalty_detail": "+5 seconds",
  "notes": "Clear contact, no doubt"
}
```

`decision_type` enum: `penalty | warning | dismiss`

**Response 200**
```json
{
  "id": 18,
  "incident_id": 42,
  "judge_id": 3,
  "decision_type": "penalty",
  "penalty_detail": "+5 seconds",
  "notes": "Clear contact, no doubt",
  "decided_at": "2025-08-10T11:24:02Z"
}
```

---

#### `GET /incidents/?race_id={race_id}`
List all incidents for a race, newest first.

**Response 200** — array of Incident objects.

---

#### `GET /incidents/{incident_id}`
Get a single incident.

**Response 200** — Incident object.

---

#### `GET /incidents/protocol?race_id={race_id}`
Get the immutable protocol (all decided incidents), ordered by sequence number.

**Response 200**
```json
[
  {
    "id": 1,
    "incident_id": 42,
    "race_id": 1,
    "sequence_number": 1,
    "pilot_numbers": "7,23",
    "violation_type": "collision",
    "decision_type": "penalty",
    "penalty_detail": "+5 seconds",
    "post_label": "T3",
    "marshal_name": "Иван Петров",
    "judge_name": "Сергей Климов",
    "created_at": "2025-08-10T11:24:02Z"
  }
]
```

---

### Audio

#### `GET /audio/{incident_id}`
Stream or download the OGG audio file for an incident. Used by the judge audio player.

**Response 200** — `Content-Type: audio/ogg`  
**Response 404** — incident or file not found.

---

### Export

#### `GET /export/{race_id}/excel`
Export the full race protocol as an Excel file.

**Response 200** — `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`  
`Content-Disposition: attachment; filename="protocol_<name>_<date>.xlsx"`

---

#### `GET /export/{race_id}/pdf`
Export the full race protocol as a PDF (landscape A4).

**Response 200** — `Content-Type: application/pdf`

---

### Health

#### `GET /health`
Liveness probe.

**Response 200**
```json
{ "status": "ok", "version": "0.1.0" }
```

---

## WebSocket Events

All messages are JSON with the envelope:

```json
{ "event": "<event_name>", "payload": { ... } }
```

### Connection endpoints

| Endpoint | Who connects | Auth |
|----------|-------------|------|
| `ws://.../ws/marshal/{marshal_id}?token={session_token}` | Marshal phone | session_token must match user.session_token |
| `ws://.../ws/judge?token={session_token}` | Judge tablet | session_token must match a user with role=judge |
| `ws://.../ws/secretary?token={session_token}` | Secretary laptop | session_token must match a user with role=secretary |
| `ws://.../ws/admin?token={session_token}` | Organizer | session_token must match a user with role=admin |

On rejection the server closes with code `4001`.

---

### Events: Server → Marshal

#### `connected`
Sent immediately after successful handshake.

```json
{
  "event": "connected",
  "payload": { "user_id": 12, "race_id": 1 }
}
```

#### `incident.ack`
Acknowledgement that a confirmed incident was received by the server.

```json
{
  "event": "incident.ack",
  "payload": { "incident_id": 42, "status": "confirmed" }
}
```

#### `heartbeat.ack`
Response to a client heartbeat ping.

```json
{ "event": "heartbeat.ack", "payload": {} }
```

---

### Events: Server → Judge

#### `connected`

```json
{
  "event": "connected",
  "payload": { "user_id": 3, "channel": "judge", "race_id": 1 }
}
```

#### `incident.new`
Pushed when a marshal confirms an incident. Judge should render an IncidentCard.

```json
{
  "event": "incident.new",
  "payload": {
    "incident_id": 42,
    "pilot_numbers": [7, 23],
    "violation_type": "collision",
    "free_text": "Turn 3, contact at exit",
    "is_emergency": false,
    "post_id": 5,
    "marshal_id": 12,
    "audio_url": "/incidents/42/audio"
  }
}
```

#### `incident.updated`
Pushed when an incident status changes (e.g. another judge decided it).

```json
{
  "event": "incident.updated",
  "payload": { "incident_id": 42, "status": "decided" }
}
```

---

### Events: Server → Secretary

#### `connected`

```json
{
  "event": "connected",
  "payload": { "user_id": 7, "channel": "secretary", "race_id": 1 }
}
```

#### `protocol.new`
Pushed after every judge decision. Secretary appends this row to the live table.

```json
{
  "event": "protocol.new",
  "payload": {
    "incident_id": 42,
    "sequence_number": 1,
    "pilot_numbers": "7,23",
    "violation_type": "collision",
    "decision_type": "penalty",
    "penalty_detail": "+5 seconds",
    "post_label": "T3"
  }
}
```

---

### Events: Server → ALL (Emergency channel)

#### `incident.new` with `is_emergency: true`
When any incident is flagged as emergency, it is broadcast to every connected WebSocket client (marshals, judges, secretaries, admin) — not just to the judge channel.

```json
{
  "event": "incident.new",
  "payload": {
    "incident_id": 99,
    "pilot_numbers": [],
    "violation_type": null,
    "free_text": "Машина перевернулась на T5",
    "is_emergency": true,
    "post_id": 8,
    "marshal_id": 14,
    "audio_url": "/incidents/99/audio"
  }
}
```

---

### Events: Client → Server (any channel)

#### `heartbeat`
Client should send every 30 seconds to keep the connection alive through idle Wi-Fi routers.

```json
{ "type": "heartbeat" }
```

---

## Error Response Format

All REST errors follow FastAPI's default:

```json
{ "detail": "Human-readable error message" }
```

HTTP status codes used:

| Code | Meaning |
|------|---------|
| 400 | Invalid state transition or bad input |
| 404 | Resource not found |
| 409 | Conflict (e.g. invite already redeemed) |
| 410 | Gone (e.g. invite expired) |
| 422 | Validation error (Pydantic) |
| 500 | Unexpected server error |
