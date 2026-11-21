import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./e2e", testMatch: "cnc-service-policy.spec.ts", workers: 1, reporter: "list", use: { baseURL: "http://127.0.0.1:4190", browserName: "chromium" } });
