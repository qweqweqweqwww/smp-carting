# Design system integration — Claude Code instructions

You are integrating a new design system into the **SMP Race Control** codebase. The design has been worked out as HTML prototypes (in `prototypes/`) and design tokens (`tokens.css`). Your job is to bring it into the real React/TypeScript code.

## Read first

1. `README.md` — overview & scope
2. `prototypes/tokens.css` — the canonical token source
3. `prototypes/screens/*.jsx` — the visual reference for every screen
4. `prototypes/index.html` — open this in a browser to see all screens together

## Repository layout (target codebase)

```
smp-carting/
├── web/                  React app: Judge, Secretary, Organizer (port 5173)
│   ├── src/
│   │   ├── pages/        judge/, secretary/, organizer/, JoinPage.tsx
│   │   ├── components/   common/, judge/, secretary/
│   │   ├── hooks/        useWebSocket, useTheme
│   │   ├── contexts/     AuthContext
│   │   └── index.css     ← swap @tailwind base setup here
│   └── tailwind.config.js  ← extend with new tokens
└── marshal-app/          React PWA: Marshal phone (port 5174)
    ├── src/
    │   ├── pages/        JoinPage.tsx, RecordPage.tsx
    │   ├── hooks/        useAudioRecorder
    │   └── contexts/     MarshalContext
    └── tailwind.config.js
```

Both apps use **React 18 + Vite + TypeScript + Tailwind**. Theme switching via the `dark` class on `<html>` (already wired in `useTheme.ts` in `web/`; replicate in `marshal-app/` if missing).

## What changes

The existing code already has the right structure and the right accent (`#2B87F7`). What changes is:

1. **Tokens** — replace the small palette in `tailwind.config.js` with the full token set (see `tailwind.config.snippet.js`)
2. **Typography** — add `JetBrains Mono` for numerics (pilot numbers, IDs, time)
3. **Components** — refresh visual treatment across all screens to match the prototypes
4. **Layout / IA** — Judge gets a focus-mode option; Organizer gets a left rail + track map; Secretary gets KPI strip + filters
5. **i18n** — UI copy moves to Russian (it's a Russian race system)

## Critical rules

- **Do not ship the HTML/JSX prototypes as-is.** They use vanilla React + inline styles for fast iteration. The real code uses TypeScript + Tailwind classes — port the *visual treatment*, not the inline-styles approach.
- **Preserve existing TypeScript types** from `web/src/types/index.ts` and the API layer in `web/src/api/`. Don't rename fields.
- **Preserve existing hooks** — `useWebSocket`, `useAuth`, `useAudioRecorder` are not changing.
- **Accent color is already `#2B87F7`** in both Tailwind configs. Don't introduce another blue.
- **Don't add filler content.** Every KPI, every chip in the prototypes maps to real state (incidents count, queue length, etc). If a backend field doesn't exist yet, leave the spot but TODO it — don't invent fake values.
- **Don't recreate copyrighted UI.** This codebase is the user's own product; recreate it freely.

## Order of operations

1. **Tokens & typography** — extend `tailwind.config.js` (both apps) using `tailwind.config.snippet.js`. Replace the top of `src/index.css` (both apps) with `index.css.snippet.css` — it bundles the Google Fonts import, `:root` + `.dark` variable blocks, base styles, and a few helper utility classes. Test that `font-mono` renders JetBrains Mono.
2. **Shared primitives** — port `Button`, `Pill`, `Wave`, `Icon` from prototypes into `web/src/components/common/` and `marshal-app/src/components/`. Use Tailwind classes, not inline styles.
3. **One screen at a time**, in this order:
   - Marshal Record (most behavior-sensitive)
   - Judge Dashboard
   - Secretary Dashboard
   - Organizer Dashboard
   - Join pages
4. **Verify both themes** — toggle dark mode on every screen; check contrast and hierarchy.

## How to verify your work

For each ported screen, side-by-side with the prototype:

- Same hierarchy (eyebrow → title → subtitle pattern)
- Same density of information
- Same statuses available (pills, dots, KPI cards)
- Same primary actions, in same positions
- Numbers use `font-mono` + `tabular-nums`
- Both themes render correctly (no hardcoded colors that break in dark mode)

You don't have to be pixel-perfect, but the prototype's hierarchy and tone must be preserved.

## When in doubt

- Prefer **CSS variables on `:root` + `.dark`** for tokens (already shown in `prototypes/tokens.css`), then map them in Tailwind's config. This makes dark mode "free" — every token has a light and dark value.
- Prefer **Tailwind utilities** for layout (`flex gap-3`, `grid grid-cols-2`) over inline styles.
- Prefer **`text-text` / `bg-surface`** semantic class names over raw color hexes.
- Lift repeated patterns (the eyebrow+title+subtitle header, KPI card, status pill) into small components.

## Files I won't touch

- `server/` — backend stays as-is
- API contracts in `web/src/api/` and `marshal-app/src/api/`
- Type definitions in `*/types/index.ts`
- `useWebSocket`, `useAudioRecorder`, `useAuth`, `MarshalContext`

You may touch component files, pages, Tailwind config, and the global `index.css`.
