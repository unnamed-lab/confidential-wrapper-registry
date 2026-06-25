import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // status palette (contrast-safe in both themes)
        active: { DEFAULT: "#16a34a", soft: "#16a34a1a" },
        revoked: { DEFAULT: "#dc2626", soft: "#dc26261a" },
        mismatch: { DEFAULT: "#d97706", soft: "#d977061a" },
      },
    },
  },
  plugins: [],
};

export default config;
