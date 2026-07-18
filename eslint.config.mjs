import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", ".wrangler/**", "out/**", "node_modules/**", "work/**", ".agents/**", ".claude/**", "coverage/**", "playwright-report/**", "test-results/**", "**/worker-configuration.d.ts", "functions/cloudflare-env.d.ts", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default config;
