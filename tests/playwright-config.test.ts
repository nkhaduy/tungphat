import { afterEach, describe, expect, it } from "vitest";
import { createPlaywrightConfig } from "../playwright.config";

const originalBaseUrl = process.env.BASE_URL;

afterEach(() => {
  if (originalBaseUrl === undefined) {
    delete process.env.BASE_URL;
  } else {
    process.env.BASE_URL = originalBaseUrl;
  }
});

describe("Playwright preview configuration", () => {
  it("uses BASE_URL without starting the local test server", () => {
    process.env.BASE_URL = "https://preview.example";

    const config = createPlaywrightConfig();

    expect(config.use?.baseURL).toBe("https://preview.example");
    expect(config.webServer).toBeUndefined();
  });

  it("keeps the local server for the default test run", () => {
    delete process.env.BASE_URL;

    const config = createPlaywrightConfig();

    expect(config.use?.baseURL).toBe("http://127.0.0.1:4173");
    expect(config.webServer).toBeDefined();
  });
});
