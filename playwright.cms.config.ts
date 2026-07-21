import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-cms",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 12_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4174",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx serve cloudflare-cms/public -l 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
