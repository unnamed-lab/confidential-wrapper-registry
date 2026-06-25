import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        space: ["var(--font-space)", "sans-serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#7c5cff",
          glow: "rgba(124, 92, 255, 0.15)",
        },
        "cyan-neon": "#00f0ff",
        "purple-neon": "#bc00dd",
        // status palette (contrast-safe neon colors)
        active: { DEFAULT: "#10b981", soft: "rgba(16, 185, 129, 0.08)" },
        revoked: { DEFAULT: "#ef4444", soft: "rgba(239, 68, 68, 0.08)" },
        mismatch: { DEFAULT: "#f59e0b", soft: "rgba(245, 158, 11, 0.08)" },
      },
    },
  },
  plugins: [],
};

export default config;
