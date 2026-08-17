import { defineConfig, devices } from "@playwright/test";

const localBaseUrl = "http://127.0.0.1:4173";

export function createPlaywrightConfig() {
  const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || process.env.BASE_URL?.trim();

  return defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
      baseURL: externalBaseUrl || localBaseUrl,
      trace: "on-first-retry",
      screenshot: "only-on-failure",
      video: process.env.PLAYWRIGHT_NO_VIDEO ? "off" : "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL || undefined } }],
    webServer: externalBaseUrl
      ? undefined
      : {
          command: "npm start",
          url: localBaseUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 300_000,
          env: {
            NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            NEXT_PUBLIC_FORMS_API_BASE: "",
            NEXT_PUBLIC_ANALYTICS_TEST_MODE: "1",
          },
        },
  });
}

export default createPlaywrightConfig();
