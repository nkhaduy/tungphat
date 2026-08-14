import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", ".worktrees/**", "**/.wrangler/**", "out/**", "output/**", "reports/**", "public/**", "data/**", "docs/**", "node_modules/**", "payload-cms/**", "quote-app/**", "work/**", ".agents/**", ".claude/**", "coverage/**", "playwright-report/**", "test-results/**", "**/worker-configuration.d.ts", "functions/cloudflare-env.d.ts", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default config;
