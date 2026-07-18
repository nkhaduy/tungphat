import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "../src/leads/turnstile";

afterEach(() => vi.unstubAllGlobals());

function result(body: object, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

const options = {
  token: "token",
  secret: "secret",
  remoteIp: "127.0.0.1",
  expectedHostname: "mdftungphat.com",
  expectedAction: "tung-phat-lead",
  environment: "production",
  allowedHostnames: ["mdftungphat.com", "www.mdftungphat.com"],
  allowedHostnameSuffixes: []
};

describe("Turnstile verification", () => {
  it("accepts exact production hostname and action", async () => {
    result({ success: true, hostname: "mdftungphat.com", action: "tung-phat-lead" });
    await expect(verifyTurnstile(options)).resolves.toMatchObject({ ok: true });
  });

  it("rejects wrong hostname, action and production suffix bypass", async () => {
    result({ success: true, hostname: "attacker.example", action: "wrong" });
    await expect(verifyTurnstile(options)).resolves.toMatchObject({ ok: false });
    await expect(verifyTurnstile({ ...options, expectedHostname: "preview.vercel.app", allowedHostnameSuffixes: [".vercel.app"] })).resolves.toMatchObject({ ok: false, reason: "hostname" });
  });

  it("returns retryable reason when Siteverify is unavailable", async () => {
    result({}, 502);
    await expect(verifyTurnstile(options)).resolves.toMatchObject({ ok: false, reason: "upstream" });
  });
});
