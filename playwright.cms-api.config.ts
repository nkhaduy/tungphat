import { defineConfig } from "@playwright/test";

const stagingURL =
  process.env.CMS_API_BASE_URL?.trim() ||
  "https://tungphat-payload-cms-staging.nkhaduy.workers.dev";

if (
  new URL(stagingURL).origin !==
  "https://tungphat-payload-cms-staging.nkhaduy.workers.dev"
) {
  throw new Error(
    "CMS API integration tests are restricted to the isolated staging Worker.",
  );
}

export default defineConfig({
  testDir: "./cms-api-e2e",
  fullyParallel: false,
  forbidOnly: true,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: stagingURL,
    trace: "retain-on-failure",
  },
});
