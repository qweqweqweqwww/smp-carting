# SMP Karting Race Control

A structured voice communication system for karting race official teams. Replaces chaotic shared radio with a pipeline: marshal speaks → voice transcribed locally → judge reviews → decision logged → secretary exports.

Designed for **local Wi-Fi only**. No internet connection required during a race.

---

## System Overview

```
[Marshal Phone]          [Local Server]          [Judge Tablet]    [Secretary Laptop]
  PTT button     →   Whisper ASR + NLP      →   Incident card  →   Live protocol
  Voice record       SQLite + audio file        Penalty/Warn/      Excel/PDF export
  Confirm/Retry      WebSocket broadcast         Dismiss button
```

### Voice Pipeline

1. Marshal holds push-to-talk on phone browser
2. Audio uploaded to local server (WAV → OGG stored)
3. Whisper transcribes speech to text (Russian, runs on CPU)
4. Rule-based NLP extracts: pilot numbers, violation type, free text
5. Marshal sees transcript on screen; confirms or retries
6. Confirmed incident pushed via WebSocket to judge channel
7. Judge reads card (text + audio player), presses Penalty / Warning / Dismiss
8. Decision written to protocol; secretary sees it live
9. After race: secretary exports Excel or PDF

---

## Roles

| Role | Device | Responsibilities |
|------|--------|-----------------|
| **Organizer / Admin** | Any browser | Creates race, adds users, generates invite links/QR codes, assigns marshals to track posts, starts/finishes race |
| **Marshal** | Phone (PWA) | Installs as home-screen app via QR invite, records voice incidents from assigned post, confirms transcript |
| **Chief Judge** | Tablet | Receives incident cards in real time, plays back audio, issues decisions |
| **Secretary** | Laptop | Monitors live protocol table, verifies entries, exports final protocol to Excel/PDF |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Database | SQLite (aiosqlite async driver), SQLAlchemy 2.x |
| Migrations | Alembic |
| ASR | OpenAI Whisper (local, `small` or `medium` model) |
| NLP | Rule-based Russian parser (no external ML models) |
| Audio conversion | ffmpeg (WAV in, OGG stored) |
| Marshal frontend | React 18 PWA (Vite + Tailwind) — installable on iOS/Android |
| Judge/Secretary/Admin frontend | React 18 web app (Vite + Tailwind) |
| Real-time | WebSocket (FastAPI native) |
| Export | openpyxl (Excel), reportlab (PDF) |

---

## Repository Structure

```
smp-carting/
├── server/                         FastAPI backend
│   ├── app/
│   │   ├── main.py                 App factory, startup hooks
│   │   ├── core/
│   │   │   ├── config.py           Settings from .env
│   │   │   └── security.py         Invite token utilities
│   │   ├── db/
│   │   │   └── database.py         Async engine, session factory, init_db
│   │   ├── models/                 SQLAlchemy ORM models
│   │   │   ├── race.py             Race, Post
│   │   │   ├── user.py             User, UserInvite, UserPost
│   │   │   ├── incident.py         Incident, Decision, ProtocolEntry
│   │   │   └── audio.py            AudioFile
│   │   ├── schemas/                Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── routes/             REST endpoints (races, users, incidents, audio, export)
│   │   │   └── ws/                 WebSocket handlers (marshal, role channels)
│   │   └── services/
│   │       ├── asr/                Whisper wrapper (async, thread pool)
│   │       ├── nlp/                Russian rule-based parser
│   │       ├── audio_service.py    WAV→OGG conversion, storage
│   │       └── ws_manager.py       Connection registry, broadcast helpers
│   ├── tests/
│   │   ├── unit/                   NLP parser tests (no I/O)
│   │   └── integration/            API tests (in-memory SQLite)
│   ├── audio_storage/              Runtime audio files (gitignored)
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── run.py                      Dev server entry point
│   └── .env.example
│
├── web/                            React app — Judge, Secretary, Organizer
│   ├── src/
│   │   ├── api/                    Axios wrappers (races, users, incidents)
│   │   ├── components/
│   │   │   ├── common/             EmergencyBanner
│   │   │   ├── judge/              IncidentCard
│   │   │   └── secretary/          ProtocolTable
│   │   ├── contexts/               AuthContext
│   │   ├── hooks/                  useWebSocket
│   │   ├── pages/
│   │   │   ├── organizer/          OrganizerDashboard
│   │   │   ├── judge/              JudgeDashboard
│   │   │   └── secretary/          SecretaryDashboard
│   │   └── types/                  Shared TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── marshal-app/                    React PWA — Marshal phone
│   ├── src/
│   │   ├── api/                    redeemInvite, uploadAudio, confirmIncident
│   │   ├── contexts/               MarshalContext (session storage)
│   │   ├── hooks/                  useAudioRecorder (MediaRecorder API)
│   │   ├── pages/
│   │   │   ├── JoinPage.tsx        Invite token redemption
│   │   │   └── RecordPage.tsx      PTT + confirmation UI
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts              PWA manifest + Workbox caching
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

On first start, SQLite tables are created automatically via `init_db()`.  
For production use Alembic migrations (`alembic upgrade head`).

### 2. Web App (Judge + Secretary + Organizer)

```bash
cd web
npm install
npm run dev
# Available at http://localhost:5173
```

### 3. Marshal PWA

```bash
cd marshal-app
npm install
npm run dev
# Available at http://localhost:5174
```

For marshals to connect from phones, make sure the server and marshal-app are reachable on the race venue Wi-Fi. Use the machine's LAN IP rather than `localhost`:

```bash
# Example: server at 192.168.1.100:8000, marshal app at 192.168.1.100:5174
# The organizer generates invites with base_url = http://192.168.1.100:5174
```

### 4. Run Tests

```bash
cd server
pytest
```

---

## First Race Checklist

1. Start server on race-venue laptop/mini-PC
2. Open organizer dashboard (`http://<server-ip>:5173`)
3. Create race, add track posts (drag on map)
4. Add users: one marshal per post, one judge, one secretary
5. Generate invite QR for each marshal
6. Marshals scan QR with phone camera → PWA opens → app installs to home screen
7. Organizer assigns each marshal to their track post
8. Start race
9. Judge opens `http://<server-ip>:5173` → automatically routed to Judge Panel
10. Secretary opens same URL → routed to Secretary Dashboard
11. Race runs; incidents flow through the pipeline
12. After race: secretary exports protocol

---

## Configuration Reference

All server configuration is via environment variables (`.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `change-me-before-first-race` | **Must be changed.** Signs session tokens. |
| `WHISPER_MODEL` | `small` | `small` (faster) or `medium` (more accurate) |
| `WHISPER_LANGUAGE` | `ru` | Language code for ASR |
| `WHISPER_DEVICE` | `cpu` | `cpu` or `cuda` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./smp_karting.db` | SQLite file path |
| `AUDIO_STORAGE_DIR` | `audio_storage` | Directory for OGG files |
| `INVITE_TOKEN_EXPIRE_HOURS` | `72` | How long invite links are valid |
| `DEBUG` | `false` | Enables hot reload and `/docs` endpoint |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Bind port |

---

## Key Design Decisions

**Offline-first**: The entire system runs on one machine connected to local Wi-Fi. Whisper runs on CPU. SQLite needs no separate process. No cloud services are called.

**No passwords**: Marshals authenticate exclusively via one-time QR invite links. Judges and secretaries receive session tokens from the organizer directly. This eliminates password management at the track.

**Rule-based NLP over ML NER**: The Russian incident parser uses regex patterns rather than a trained NLP model. This keeps the system fully offline, makes vocabulary additions trivial (edit one file), and produces deterministic output the team can reason about.

**Denormalized protocol entries**: `protocol_entries` snapshots names and labels at decision time. If a typo is corrected after the fact, the audit trail remains accurate. This matters for race steward appeals.

**WAV in, OGG stored**: Clients record in the browser's native format (WebM/Opus). The server converts to OGG Vorbis for compact storage. Both formats are lossless-enough for human voice. OGG is universally playable in browsers.
