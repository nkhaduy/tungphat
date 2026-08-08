import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", "**/.wrangler/**", "out/**", "light-cms/dist/**", "quote-app/**", "node_modules/**", "work/**", ".agents/**", ".claude/**", "coverage/**", "playwright-report/**", "test-results/**", "**/worker-configuration.d.ts", "functions/cloudflare-env.d.ts", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { files: ["light-cms/**/*.{ts,tsx}"], rules: { "@next/next/no-img-element": "off" } },
];

export default config;
