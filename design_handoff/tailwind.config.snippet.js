/**
 * Drop-in extension for `tailwind.config.js` in BOTH `web/` and `marshal-app/`.
 *
 * Replace the `theme.extend` object with this one (or merge if you have other
 * extensions). The semantic color names (--bg, --text, etc.) read CSS
 * variables so light and dark themes are driven entirely from
 * `src/index.css` (see the @layer base block we add there).
 *
 * After applying:
 *   1. Restart the dev server (Tailwind needs to re-scan).
 *   2. In `index.css`, import Google Fonts and define `:root` + `.dark` CSS variable blocks
 *      (copy the relevant blocks from `tokens.css` in this handoff).
 *   3. Toggle dark mode via `document.documentElement.classList.toggle('dark')`
 *      (already wired in `web/src/hooks/useTheme.ts`).
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // ───────────────────────────────────────────────────────────
      // Colors — accent is the existing #2B87F7 brand blue.
      // Semantic names (bg, surface, text, etc.) read CSS variables,
      // so they swap automatically when `.dark` is on <html>.
      // ───────────────────────────────────────────────────────────
      colors: {
        // Accent scale (raw, theme-independent)
        brand: {
          50:  "#EBF4FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2B87F7",
          600: "#1D6FD4",
          700: "#1558AB",
          800: "#0E4182",
          900: "#082B59",
        },

        // Semantic surfaces (CSS vars — light + dark in index.css)
        bg:           "var(--bg)",
        "bg-elev":    "var(--bg-elev)",
        surface:      "var(--surface)",
        "surface-2":  "var(--surface-2)",
        border:       "var(--border)",
        "border-strong": "var(--border-strong)",
        divider:      "var(--divider)",

        // Semantic text
        text:        "var(--text)",
        "text-2":    "var(--text-2)",
        "text-3":    "var(--text-3)",
        "text-mute": "var(--text-mute)",

        // Status (also CSS vars so dark variants kick in automatically)
        emergency:    "var(--c-emergency)",
        "emergency-bg": "var(--c-emergency-bg)",
        warning:      "var(--c-warning)",
        "warning-bg": "var(--c-warning-bg)",
        success:      "var(--c-success)",
        "success-bg": "var(--c-success-bg)",
      },

      // ───────────────────────────────────────────────────────────
      // Typography
      // ───────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },

      // Tabular numerals utility — use as `font-tnum`
      fontVariantNumeric: {
        tnum: "tabular-nums",
      },

      // ───────────────────────────────────────────────────────────
      // Geometry — radii and shadows
      // ───────────────────────────────────────────────────────────
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },

      boxShadow: {
        sm:    "0 1px 2px rgba(14, 19, 32, 0.04), 0 1px 1px rgba(14, 19, 32, 0.04)",
        md:    "0 4px 12px rgba(14, 19, 32, 0.06), 0 1px 2px rgba(14, 19, 32, 0.04)",
        lg:    "0 12px 32px rgba(14, 19, 32, 0.10), 0 2px 6px rgba(14, 19, 32, 0.05)",
        brand: "0 6px 20px rgba(43, 135, 247, 0.28)",
      },

      // Brand-pulse animation used for live status dots and emergency banner
      keyframes: {
        "smp-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.55" },
        },
        "smp-spin": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "smp-pulse": "smp-pulse 1.6s ease-in-out infinite",
        "smp-spin":  "smp-spin 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
