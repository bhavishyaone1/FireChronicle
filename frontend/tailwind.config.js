/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        action: "var(--action)",
        "accent-cyan": "var(--accent-cyan)",
        "accent-violet": "var(--accent-violet)",
        "viirs-cyan": "var(--viirs-cyan)",
        matched: "var(--matched)",
        "fire-low": "var(--fire-low)",
        "fire-mid": "var(--fire-mid)",
        "fire-high": "var(--fire-high)",
        nasa: {
          dark: "#0A0F1A",
          card: "#101827",
          border: "#26364B",
          cyan: "#40C4D8",
          violet: "#A78BFA",
          viirs: "#38BDF8",
          orange: "#FB923C",
          red: "#EF4444",
          amber: "#FDE68A",
          slate: "#A8B6C8",
        },
      },
    },
  },
  plugins: [],
};
