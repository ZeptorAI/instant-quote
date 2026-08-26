import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        line: "var(--line)",
        text: "var(--text)",
        muted: "var(--muted)",
        blue: "var(--blue)",
        cyan: "var(--cyan)",
        green: "var(--green)",
        amber: "var(--amber)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.25)",
        glow: "0 0 0 1px rgba(59,130,246,.25), 0 8px 40px rgba(34,211,238,.12)",
      },
      fontFeatureSettings: {
        nums: '"tnum" 1',
      },
    },
  },
  plugins: [],
};

export default config;
