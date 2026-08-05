import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          strong: "var(--color-brand-strong)",
          soft: "var(--color-brand-soft)"
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)"
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          warm: "var(--color-surface-warm)"
        },
        copy: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)"
        },
        forest: {
          950: "#062b1d",
          900: "#073b28",
          800: "#0b4d34",
          700: "#126241"
        },
        wood: {
          500: "#b84d00",
          600: "#963d00",
          700: "#b84d00",
          800: "#963d00"
        },
        cream: "#f5f2eb",
        ink: "#16211b"
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Arial", "sans-serif"],
        display: ["var(--font-montserrat)", "Arial", "sans-serif"]
      },
      boxShadow: {
        card: "var(--shadow-card)",
        header: "var(--shadow-header)"
      }
    }
  },
  plugins: [typography]
};

export default config;
