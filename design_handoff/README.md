# Handoff: SMP Race Control — Design System

## Overview

This package describes the design system for **SMP Race Control** — a voice-incident pipeline for karting officials (Marshal → Server → Judge → Secretary).

It covers:

- Design tokens (color, typography, spacing, radii, shadow)
- A small set of shared components (button, pill, KPI card, audio player, incident card)
- Full visual specs for all 5 screens, in light and dark theme, in correctly-sized device frames
- 2 design variants for the two most behavior-sensitive screens (Marshal Record, Judge Dashboard)
- An integration plan for the existing React/TypeScript codebase

## About the design files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior. **They are not production code to copy directly.**

The actual codebase (in `web/` and `marshal-app/` of the user's repo) is a React 18 + Vite + TypeScript + Tailwind application. Your task is to **recreate the visual treatment of these prototypes in the existing codebase** using its established patterns (Tailwind classes, TypeScript components, existing hooks and contexts).

See `CLAUDE.md` for execution instructions.

## Fidelity

**High-fidelity.** Exact colors, spacing, radii, typography, and layout. The prototype is what the final UI should look like.

## What's in this bundle

```
design_handoff/
├── README.md                         ← this file (full spec)
├── CLAUDE.md                         ← read-first instructions for Claude Code
├── tokens.css                        ← drop-in CSS-variable token file (light + dark)
├── tailwind.config.snippet.js        ← Tailwind theme.extend additions
├── index.css.snippet.css             ← drop-in top-of-`src/index.css` (fonts + variables + helpers)
└── prototypes/
    ├── index.html                    ← open in a browser to see all screens
    ├── tokens.css                    ← same as ../tokens.css (kept here for the prototype to run)
    ├── design-canvas.jsx             ← canvas wrapper (NOT part of the product)
    ├── ios-frame.jsx                 ← iPhone bezel (NOT part of the product)
    ├── browser-window.jsx            ← desktop window chrome (NOT part of the product)
    └── screens/
        ├── foundations.jsx           ← tokens reference card
        ├── components.jsx            ← component library reference
        ├── marshal.jsx               ← Marshal V1 + V2
        ├── judge.jsx                 ← Judge V1 + V2
        ├── secretary.jsx             ← Secretary
        ├── organizer.jsx             ← Organizer
        └── join.jsx                  ← Join page (loading + error)
```

To preview locally: serve `prototypes/` with any static server (`python -m http.server`, `npx serve`) and open `index.html`.

---

## 1 · Design tokens

All semantic tokens are CSS variables, so light/dark switching is automatic. Raw scale colors (brand-50…900, etc.) are theme-independent.

### Accent (brand)

| Token       | Hex       | Use                                       |
| ----------- | --------- | ----------------------------------------- |
| `brand-50`  | `#EBF4FF` | Tint background (selected row)            |
| `brand-100` | `#DBEAFE` | Tint background                           |
| `brand-200` | `#BFDBFE` |                                           |
| `brand-300` | `#93C5FD` |                                           |
| `brand-400` | `#60A5FA` |                                           |
| `brand-500` | `#2B87F7` | **Base accent. Primary CTAs, links, focus** |
| `brand-600` | `#1D6FD4` | Hover state for primary buttons           |
| `brand-700` | `#1558AB` | Active/pressed                            |
| `brand-800` | `#0E4182` | Strong text on light bg                   |
| `brand-900` | `#082B59` | Deepest blue (rare)                       |

### Semantic surfaces

| Token            | Light       | Dark        | Use                          |
| ---------------- | ----------- | ----------- | ---------------------------- |
| `bg`             | `#F4F6FA`   | `#14171F`   | App background               |
| `bg-elev`        | `#FFFFFF`   | `#1A1D27`   | Elevated zones (rails, navs) |
| `surface`        | `#FFFFFF`   | `#1F2332`   | Cards                        |
| `surface-2`      | `#F7F9FC`   | `#252A3B`   | Nested blocks, inputs        |
| `border`         | `#E5E8EF`   | `#2A2F40`   | Dividers, card borders       |
| `border-strong`  | `#CDD3DE`   | `#3A4159`   | Emphasis borders             |
| `divider`        | `#EEF1F5`   | `#232838`   | Table rows                   |

### Semantic text

| Token       | Light       | Dark        | Use                       |
| ----------- | ----------- | ----------- | ------------------------- |
| `text`      | `#0E1320`   | `#F2F4F8`   | Primary text              |
| `text-2`    | `#3D4458`   | `#C5CAD5`   | Secondary text            |
| `text-3`    | `#6B7280`   | `#8A92A3`   | Tertiary, captions        |
| `text-mute` | `#9AA3B2`   | `#5C6478`   | Disabled, dashes          |

### Status

| Token              | Light     | Dark     | Use                                |
| ------------------ | --------- | -------- | ---------------------------------- |
| `emergency`        | `#DC2626` | `#F87171` | Aварии, penalty buttons            |
| `emergency-bg`     | `#FEF2F2` | `rgba(220,38,38,.12)` | Tint behind emergency badges     |
| `warning`          | `#D97706` | `#FBBF24` | Warning decisions, pending queue   |
| `warning-bg`       | `#FFFBEB` | `rgba(217,119,6,.12)` |                                  |
| `success`          | `#059669` | `#34D399` | Active race, decision accepted     |
| `success-bg`       | `#ECFDF5` | `rgba(5,150,105,.12)` |                                  |

### Typography

- **Sans:** `Inter` (weights 400, 500, 600, 700, 800) — already in use
- **Mono:** `JetBrains Mono` (weights 500, 600, 700) — **NEW**, used for pilot numbers, incident IDs, timestamps, race timer

Import in `index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
```

#### Type scale

| Step       | Size | Weight | Tracking   | Example use                          |
| ---------- | ---- | ------ | ---------- | ------------------------------------ |
| Display    | 36   | 800    | `-0.02em`  | Page hero on Foundations             |
| H1         | 24   | 700    | `-0.015em` | Page titles                          |
| H2         | 18   | 600    | `-0.01em`  | Section headers                      |
| Body       | 15   | 500    | `-0.005em` | Default body                         |
| Caption    | 12   | 500    | `0`        | Timestamps, supporting text          |
| Label      | 11   | 600    | `0.08em` uppercase | Eyebrows, table headers      |
| Eyebrow    | 10   | 700    | `0.12em` uppercase | Brand-coloured section hints |
| Mono · 28  | 28   | 700    | `-0.01em`  | Race timer, pilot numbers in cards   |

### Geometry

- **Radii:** `xs:4 · sm:6 · md:10 · lg:14 · xl:20` (no fully-rounded pill containers except status pills)
- **Spacing:** 4-base scale — `4, 8, 12, 16, 20, 24, 32, 40, 48`
- **Shadows:** `sm` (raised card), `md` (popover), `lg` (modal), `brand` (primary button)

### Tone of voice

- **Technical**: short phrases, marshal protocol. "Пост М-03", "Инцидент #042", "Пилот 7".
- **Calm**: no exclamation marks, no emoji. Color carries the load — red is reserved for emergencies.
- **Numbers first**: digits are always JetBrains Mono with `tabular-nums`. Time and pilot numbers always align.

---

## 2 · Component library

All components live (in the target codebase) under `web/src/components/common/` and `marshal-app/src/components/`. Use Tailwind utilities, not inline styles.

### Button

5 variants × 3 sizes.

| Variant     | Background           | Foreground   | Use                                  |
| ----------- | -------------------- | ------------ | ------------------------------------ |
| `primary`   | `brand-500`          | white        | Main CTA per screen                  |
| `secondary` | `surface` + border   | `text`       | Default secondary action             |
| `ghost`     | transparent          | `text-2`     | Tertiary, cancel-ish                 |
| `danger`    | `emergency`          | white        | Penalty button on incident cards     |
| `warning`   | `warning`            | white        | Warning decision button              |
| `success`   | `success`            | white        | Confirm / sent state                 |

Sizes: `sm` (h-30, text-12), `md` (h-38, text-13.5), `lg` (h-50, text-15). Primary always carries `shadow-brand`. Active state: `scale-95` transform.

### Status pill

Compact rounded-full chip with optional dot.

Tones: `neutral`, `brand`, `success`, `warning`, `danger`. Use `font-mono` variant for IDs (`#042`, `M-03`).

### Eyebrow / Label

- **Eyebrow** — 10/700 uppercase, `0.12em` tracking, `brand-500` color. Used above page titles.
- **Label** — 11/600 uppercase, `0.08em` tracking, `text-3` color. Used above form fields and KPI numbers.

### KPI card

Used in Judge V1, Secretary, Organizer dashboards.

```
+-------------------------+
| ИНЦИДЕНТОВ          42  |   ← label (left), mono number (right)
| 17% от инц.             |   ← optional sub-line under label
+-------------------------+
```

- Background: `surface`
- Border: `1px solid border`
- Radius: `md`
- Padding: `14px 18px`
- Number: `font-mono` `font-tnum` 28/700, `-0.02em`
- Number color is colored when the metric is a status (warning → `warning`, danger → `emergency`, success → `success`)

### Incident card

Two sizes — grid card (Judge V1) and focus card (Judge V2). Structure:

1. Emergency strip (only if `is_emergency`)
2. Meta row: `#042` pill + `M-03` pill on left, timestamp on right (mono)
3. "ПИЛОТЫ" label + huge mono number `07 · 23`
4. Violation type + location ("Столкновение · Поворот 4")
5. Optional transcript blockquote (italic, surface-2 background, left border)
6. Audio player (play button + waveform + duration)
7. (Focus only) penalty detail input
8. 3 decision buttons (Штраф / Предупр. / Снять)

Left border: `3px solid brand-500` (or `emergency` if emergency).

### Audio player

```
[▶]  ▁▂▅▆█▇▆▄▂▁▂▄▅▆▇▆▅▄▂▁     0:08
```

- Play button: 30–36px circle, `brand-500` background, white play icon
- Waveform: bars `brand-500`, 2.5px wide, 2px gap; static fake waveform is fine
- Duration: mono 11, `text-3`

### Waveform (recording state)

Same primitive, but bars are `emergency` colored and animated when actively recording. The Marshal V2 prototype shows the recording state.

### Role chip

For team listing in Organizer.

```
[M] Маршал
    marshal
```

- 30×30 rounded-`sm` colored letter avatar (role's accent at 14% opacity background)
- Role letter (M, J, S) in role accent color
- Name + role label stacked

Role accents:

- Marshal → `brand-500`
- Judge → `warning`
- Secretary → `success`
- Organizer → `#8B5CF6` (purple — only place in the system)

### AppShell (web)

60px topbar with:

- Brand mark (30px `brand-500` square with white `SMP` mono) + "Race Control" + race subtitle
- Right side: live race timer pill (success tone, with pulsing dot) → divider → role pill → user name

### Mobile header (marshal)

14px padding, single-row title block:

- `/` slash + "SMP Race Control" + live dot
- Big "МАРШАЛ · ПОСТ M-03" label
- Big 20/700 name
- Race name caption

---

## 3 · Screens

Reference visuals live in `prototypes/screens/*.jsx`. Each is described below by purpose, layout, and notable details.

### 3.1 Marshal Record — `marshal-app/src/pages/RecordPage.tsx`

Two variants are provided. **Recommended: V2.**

**V1 — classic PTT (refined existing layout)**
- Header → emergency toggle full-width bar → centered "Hold to record" + 200×200 PTT circle
- Confirmation slides up as a card replacing the PTT area
- States: `idle`, `recording`, `confirming`

**V2 — waveform-first (recommended)**
- Compact header strip with race name and post (no full status bar)
- "Hero" card with race timer (left) and incidents-sent count (right)
- Waveform stage above the PTT (always visible — gives the marshal a live audio feedback)
- 168×168 PTT circle below
- Emergency toggle as an outlined pill below the PTT (less aggressive than V1's full bar)
- Confirmation panel replaces the PTT+waveform area; chip-based violation picker instead of a dropdown
- States as V1

Both variants use `MarshalContext` for session/post info and `useAudioRecorder` for the audio pipeline.

### 3.2 Judge Dashboard — `web/src/pages/judge/JudgeDashboard.tsx`

**V1 — grid (refined existing)**
- Heading row: "Очередь инцидентов" + KPI strip (queue, decided, penalties, emergencies)
- 2-column grid of incident cards
- Each card uses the structure described in §2

**V2 — focus mode (recommended for tablet)**
- Optional emergency strip across the top of the page
- Left rail (340px): queue list with post filters and recent decisions; selected item highlighted with brand border + halo
- Main area: one big incident card with bigger pilot numbers (52px), bigger audio player, an optional penalty-detail input, and full-size decision buttons
- Prev/Next navigation in the heading

WebSocket message handling and decision API call (`decideIncident`) stay unchanged — these are visual refactors only.

### 3.3 Secretary Dashboard — `web/src/pages/secretary/SecretaryDashboard.tsx`

- Heading row: "Протокол гонки" + export buttons (Excel / PDF) + "Завершить гонку" primary
- 5-column KPI strip (Records, Penalties, Warnings, Dismissed, Emergencies — with %ages)
- Filter bar: search input + 4 toggle chips (Все, Штраф, Предупр., Снято)
- Dense table — headers in 10.5/700 uppercase `text-3`, body 12.5; row height ~36px; alternate divider lines (not zebra)
- Columns: `#` (mono), Time (mono), Pilots (mono bold), Violation, Decision (pill + detail), Post (mono), Marshal, Judge

Subscribes to the `protocol` WebSocket channel for live appends.

### 3.4 Organizer Dashboard — `web/src/pages/organizer/OrganizerDashboard.tsx`

Heaviest UX rework. Structure:

- Left rail (280px): race list with status pills; the current race is brand-bordered with halo
- Main: heading with race meta + "Закончить гонку" danger button
- 4-column KPI strip (Posts, Incidents, In queue, Emergencies)
- Two-column body:
  - **Left column** (Team card): role-grouped rows showing avatar, name+role, post (mono), online status pill, action (QR-invite for marshals; "Ссылка" for judge/secretary)
  - **Right column**: Track map card (SVG track outline + post markers — placeholder) + Live activity feed (4-most-recent events with mono timestamps)
- Modal: QR-invite — large QR code (drawn as SVG placeholder), invite URL in mono, copy + done buttons. Show with a dimmed backdrop + blur.

### 3.5 Join — `web/src/pages/JoinPage.tsx` & `marshal-app/src/pages/JoinPage.tsx`

Two states:

- **Connecting** — full-bleed `brand-600` background with subtle racing-line stripes (115deg repeating gradient at 4% opacity) and one radial highlight. White content: SMP mark, "Маршал · Пост M-03" eyebrow, big H1 "Подключаемся к гонке…", and a 3-step checklist (done / doing / wait) inside a translucent black panel
- **Error** — neutral light/dark background with a single centered card containing a red X icon, eyebrow "Ошибка входа", title "Ссылка недействительна", explanation, and a code chip `INV_EXPIRED`

For marshals, the connecting state is always shown briefly during invite redemption (`redeemInvite` in `marshal-app/src/api/marshal.ts`).

---

## 4 · Integration plan

See `CLAUDE.md` for the execution order. In summary:

1. **Apply tokens** — extend `tailwind.config.js` in both apps from `tailwind.config.snippet.js`. Replace the top of both `src/index.css` files with `index.css.snippet.css` (it includes the Google Fonts import + `:root` + `.dark` blocks + helper utilities).
2. **Port shared primitives** — `Button`, `Pill`, `KPICard`, `Waveform`, `AppShell`, into `web/src/components/common/`.
3. **Refresh screens** in this order: Marshal Record (use V2) → Judge (use V2) → Secretary → Organizer → Join.
4. **Verify both themes** on every screen.

---

## 5 · Out of scope

- Backend (`server/`) and API contracts — not changing.
- WebSocket protocol — not changing.
- TypeScript types in `web/src/types/index.ts` and `marshal-app/src/types/index.ts` — not changing.
- Auth flow — not changing.

If a design needs a field that doesn't exist on a type, leave the slot but add a `// TODO(api): expose <field>` comment — do not invent data.

---

## 6 · Assets

- **Logos** — there is no SMP Karting logo asset bundled. Use the text mark "SMP" in a brand-500 square as shown across the prototypes until an SVG logo is provided.
- **Track map** — a generic SVG placeholder is used in the Organizer prototype. The real version should consume `race.posts` from the API and render real coordinates.
- **QR codes** — the Organizer prototype draws a fake QR via SVG. The real version already uses `qr_code_url` from the `createInvite` response (`web/src/api/users.ts`).
- **Icons** — minimal custom inline SVG set (mic, play, check, x, flag, download, plus). Keep them inline; do not add an icon library.

---

## 7 · Files referenced from this handoff

- `tokens.css` — drop-in for both apps' `src/index.css`
- `tailwind.config.snippet.js` — drop-in for both apps' `tailwind.config.js`
- `prototypes/index.html` — open in browser to see all screens
- `prototypes/screens/*.jsx` — per-screen visual reference

If anything in this README is unclear, the prototype is the source of truth — it's the rendered design.
