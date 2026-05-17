/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
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
        bg:             "var(--bg)",
        "bg-elev":      "var(--bg-elev)",
        surface:        "var(--surface)",
        "surface-2":    "var(--surface-2)",
        border:         "var(--border)",
        "border-strong":"var(--border-strong)",
        divider:        "var(--divider)",
        text:           "var(--text)",
        "text-2":       "var(--text-2)",
        "text-3":       "var(--text-3)",
        "text-mute":    "var(--text-mute)",
        emergency:      "var(--c-emergency)",
        "emergency-bg": "var(--c-emergency-bg)",
        warning:        "var(--c-warning)",
        "warning-bg":   "var(--c-warning-bg)",
        success:        "var(--c-success)",
        "success-bg":   "var(--c-success-bg)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
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
