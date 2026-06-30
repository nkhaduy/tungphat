import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#062b1d",
          900: "#073b28",
          800: "#0b4d34",
          700: "#126241"
        },
        wood: {
          500: "#ed7610",
          600: "#d96008"
        },
        cream: "#f5f2eb",
        ink: "#16211b"
      },
      fontFamily: {
        sans: ["var(--font-montserrat)"],
        display: ["var(--font-montserrat)"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,42,28,.06), 0 8px 28px rgba(10,42,28,.09)"
      }
    }
  },
  plugins: []
};

export default config;
