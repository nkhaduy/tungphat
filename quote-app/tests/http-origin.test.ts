import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../src/worker/http";

describe("isAllowedOrigin", () => {
  const env = {
    APP_ORIGIN: "https://baogia.mdftungphat.com,https://baogia.gotungphat.com",
  } as QuoteAppEnv;

  it.each([
    "https://baogia.mdftungphat.com",
    "https://baogia.gotungphat.com",
  ])("allows configured app origin %s", (origin) => {
    const request = new Request(`${origin}/api/auth/login`, { headers: { Origin: origin } });
    expect(isAllowedOrigin(request, env)).toBe(true);
  });

  it("rejects origins outside the configured app origins", () => {
    const origin = "https://attacker.example";
    const request = new Request("https://baogia.gotungphat.com/api/auth/login", { headers: { Origin: origin } });
    expect(isAllowedOrigin(request, env)).toBe(false);
  });
});
