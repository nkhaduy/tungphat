import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules/**", ".wrangler/**", "worker-configuration.d.ts", "public/*.js"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { URL: "readonly", console: "readonly", process: "readonly" }
    }
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "no-control-regex": "off"
    }
  }
);
