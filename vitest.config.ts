import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) }
  },
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "json-summary"], include: ["lib/lead-schema.ts", "lib/content-schema.ts"] }
  }
});
