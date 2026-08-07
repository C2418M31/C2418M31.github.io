import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Populated by next/font in app/layout.tsx via --font-inter; falls
        // back to system sans if that variable is ever missing.
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Used sparingly on primary buttons / active toggle states rather
        // than everywhere, so it still reads as an accent, not noise.
        glow: "0 0 0 1px rgb(99 102 241 / 0.4), 0 4px 16px -4px rgb(99 102 241 / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
