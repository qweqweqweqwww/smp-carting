# SMP Karting Race Control

A structured voice communication system for karting race official teams. Replaces chaotic shared radio with a pipeline: marshal speaks → voice transcribed locally → judge reviews → decision logged → secretary exports.

Designed for **local Wi-Fi only**. No internet connection required during a race.

---

## System Overview

```
[Marshal Phone]          [Local Server]          [Judge Tablet]    [Secretary Laptop]
  PTT button     →   Whisper ASR + NLP      →   Incident card  →   Live protocol
  Voice record       SQLite + audio file        Penalty/Warn/      Excel/PDF export
  Auto-confirm        WebSocket broadcast         Dismiss / Split
```

### Voice Pipeline

1. Marshal holds push-to-talk on phone browser (MediaRecorder API, WebM/Opus)
2. Audio uploaded to local server (WebM → OGG stored via ffmpeg)
3. Whisper transcribes speech to text (Russian, runs on CPU)
4. Rule-based NLP extracts: pilot numbers, violation type, free text, emergency flag
5. Incident is automatically confirmed and pushed via WebSocket to the judge channel (marshal sees an "Отправлено" confirmation, or a retry button on error)
6. Judge reads the incident card (transcript + audio player + pilot numbers reported by the marshal)
7. Judge issues a decision:
   - **Single**: assign the penalty/warning/dismiss to one pilot — optionally overriding the pilot number reported by the marshal
   - **Split**: divide one incident into two separate decisions (different pilot numbers, different penalties), creating two independent protocol entries
8. Decision(s) written to the protocol; secretary sees them live via WebSocket
9. After race: secretary exports Excel or PDF

---

## Roles

| Role | Device | Responsibilities |
|------|--------|-----------------|
| **Organizer / Admin** | Any browser | Creates race, adds users, generates invite links/QR codes (individually or all marshals at once via "QR · Все"), assigns marshals to track posts, starts/finishes race |
| **Marshal** | Phone (PWA) | Installs as home-screen app via QR invite, records voice incidents from assigned post |
| **Chief Judge** | Tablet | Logs in with name + password. Receives incident cards in real time, plays back audio, assigns the penalty to a specific pilot (can override the number reported by the marshal), and can split one incident into two separate decisions for two pilots |
| **Secretary** | Laptop | Logs in with name + password. Monitors live protocol table (each judge decision = one row, even when split from a single incident), verifies entries, exports final protocol to Excel/PDF |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Database | SQLite (aiosqlite async driver), SQLAlchemy 2.x |
| Migrations | No Alembic — `init_db()` in `db/database.py` runs `create_all` plus small in-place SQLite migrations (table rebuilds) for schema changes on existing databases |
| ASR | OpenAI Whisper (local, `small` or `medium` model) |
| NLP | Rule-based Russian parser (no external ML models) |
| Audio conversion | ffmpeg (WebM in, OGG stored) |
| Marshal frontend | React 18 PWA (Vite + Tailwind, `vite-plugin-pwa`) — installable on iOS/Android, offline-cached API responses |
| Judge/Secretary/Admin frontend | React 18 web app (Vite + Tailwind, React Query) |
| Real-time | WebSocket (FastAPI native) |
| Export | openpyxl (Excel), reportlab (PDF, with embedded DejaVu fonts for Cyrillic) |

---

## Repository Structure

```
smp-carting/
├── server/                         FastAPI backend
│   ├── app/
│   │   ├── main.py                 App factory, startup hooks
│   │   ├── core/
│   │   │   ├── config.py           Settings from .env
│   │   │   └── security.py         Password hashing, invite/session tokens
│   │   ├── db/
│   │   │   └── database.py         Async engine, session factory, init_db + migrations
│   │   ├── models/                 SQLAlchemy ORM models
│   │   │   ├── race.py             Race, Post
│   │   │   ├── user.py             User, UserInvite, UserPost
│   │   │   ├── incident.py         Incident, Decision, ProtocolEntry
│   │   │   └── audio.py            AudioFile
│   │   ├── schemas/                Pydantic request/response schemas
│   │   │   ├── race.py
│   │   │   ├── user.py
│   │   │   └── incident.py         Incident/Decision/ProtocolEntry + split-decision schemas
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── races.py        Race + post CRUD, start/finish
│   │   │   │   ├── users.py        Users, login, invites/QR, post assignment
│   │   │   │   ├── incidents.py    Audio upload, confirm, decide, decide-split, protocol
│   │   │   │   ├── audio.py        Streams OGG audio for judge playback
│   │   │   │   └── export.py       Excel/PDF protocol export
│   │   │   └── ws/
│   │   │       ├── marshal_ws.py   Marshal-side WebSocket
│   │   │       └── role_ws.py      Judge/secretary channel WebSocket
│   │   └── services/
│   │       ├── asr/                Whisper wrapper (async, single-thread pool)
│   │       ├── nlp/                Russian rule-based parser
│   │       ├── audio_service.py    WebM→OGG conversion, storage
│   │       └── ws_manager.py       Connection registry, broadcast helpers
│   ├── fonts/                       DejaVu fonts for Cyrillic PDF export
│   ├── tests/
│   │   ├── unit/                   NLP parser tests (no I/O)
│   │   └── integration/            API tests (in-memory SQLite)
│   ├── audio_storage/              Runtime audio files (gitignored)
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── run.py                      Dev server entry point (port 8000)
│   └── .env.example
│
├── web/                             React app — Judge, Secretary, Organizer (port 5174)
│   ├── src/
│   │   ├── api/                     Axios wrappers (races, users, incidents)
│   │   ├── components/
│   │   │   ├── common/              AppShell, KpiCard, Pill, ThemeToggle, EmergencyBanner
│   │   │   ├── judge/                IncidentCard (single + split decision UI)
│   │   │   └── secretary/            ProtocolTable
│   │   ├── contexts/                 AuthContext (name+password login, session token)
│   │   ├── hooks/                    useWebSocket, useTheme
│   │   ├── pages/
│   │   │   ├── organizer/            OrganizerDashboard (race/post/user mgmt, bulk QR print)
│   │   │   ├── judge/                JudgeDashboard
│   │   │   └── secretary/            SecretaryDashboard
│   │   ├── utils/                    labels.ts (enum → RU label maps)
│   │   └── types/                    Shared TypeScript types
│   ├── package.json
│   └── vite.config.ts                dev port 5174 (proxies /api and /ws to :8000)
│
├── marshal-app/                    React PWA — Marshal phone (port 5175)
│   ├── src/
│   │   ├── api/                     redeemInvite, uploadAudio, confirmIncident, getRace
│   │   ├── contexts/                 MarshalContext (session storage)
│   │   ├── hooks/                    useAudioRecorder (MediaRecorder API)
│   │   ├── pages/
│   │   │   ├── JoinPage.tsx          Invite token redemption
│   │   │   └── RecordPage.tsx        PTT + auto-confirm UI
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts                dev port 5175, PWA manifest + Workbox caching
│
└── docs/
    ├── api-contracts.md            All REST + WebSocket contracts
    └── data-model.md               Database schema reference
```

---

## How to Run

### Prerequisites

- Python 3.11+
- Node.js 20+
- ffmpeg installed and on PATH (`brew install ffmpeg` / `apt install ffmpeg`)
- (Optional) CUDA-capable GPU for faster Whisper inference

### 1. Server

```bash
cd server

# Create virtual environment
python -m venv .venv && source .venv/bin/activate

# Install dependencies (includes torch — takes a few minutes)
pip install -r requirements.txt

# Copy and edit config
cp .env.example .env
# Edit .env: set SECRET_KEY, WHISPER_MODEL, etc.

# Run
python run.py
# Server starts at http://0.0.0.0:8000
```

On first start, SQLite tables are created automatically via `init_db()`. Subsequent starts also run small in-place migrations for schema changes (e.g. allowing split protocol entries) — no separate migration command needed.

### 2. Web App (Judge + Secretary + Organizer)

```bash
cd web
npm install
npm run dev -- --port 5174
# Available at http://localhost:5174
```

### 3. Marshal PWA

```bash
cd marshal-app
npm install
npm run dev -- --port 5175
# Available at http://localhost:5175
```

For marshals to connect from phones, make sure the server and marshal-app are reachable on the race venue Wi-Fi. Use the machine's LAN IP rather than `localhost`:

```bash
# Example: server at 192.168.1.100:8000, marshal app at 192.168.1.100:5175
# The organizer generates invites with base_url = http://192.168.1.100:5175
```

### 4. Run Tests

```bash
cd server
pytest
```

---

## First Race Checklist

1. Start server on race-venue laptop/mini-PC
2. Open organizer dashboard (`http://<server-ip>:5174`)
3. Create race, add track posts (drag on map)
4. Add users: one marshal per post, one judge, one secretary (judges/secretaries get a name + password)
5. Generate invite QR for each marshal — either individually, or via the **"QR · Все"** button to open a print-ready page with every marshal's QR code at once
6. Marshals scan QR with phone camera → PWA opens → app installs to home screen
7. Organizer assigns each marshal to their track post
8. Start race
9. Judge logs in at `http://<server-ip>:5174` with their name + password → routed to Judge Panel
10. Secretary logs in with their name + password → routed to Secretary Dashboard
11. Race runs; incidents flow through the pipeline. Judge can issue a single decision (with optional pilot-number override) or split one incident into two decisions for two pilots
12. After race: secretary exports protocol

---

## Configuration Reference

All server configuration is via environment variables (`.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `change-me-before-first-race` | **Must be changed.** Signs invite/session tokens. |
| `WHISPER_MODEL` | `small` | `small` (faster) or `medium` (more accurate) |
| `WHISPER_LANGUAGE` | `ru` | Language code for ASR |
| `WHISPER_DEVICE` | `cpu` | `cpu` or `cuda` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./smp_karting.db` | SQLite file path |
| `AUDIO_STORAGE_DIR` | `audio_storage` | Directory for stored audio files |
| `AUDIO_INPUT_FORMAT` | `wav` | Format accepted from client before conversion |
| `AUDIO_STORAGE_FORMAT` | `ogg` | Format persisted on disk |
| `INVITE_TOKEN_EXPIRE_HOURS` | `72` | How long marshal invite links are valid |
| `CORS_ORIGINS` | `["*"]` | Allowed origins (tighten in production) |
| `DEBUG` | `false` | Enables SQL echo and hot reload |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Bind port |
