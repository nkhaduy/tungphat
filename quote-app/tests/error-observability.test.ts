import { describe, expect, it } from "vitest";
import { app } from "../src/worker/index";

const env = { SESSION_SECRET: "s".repeat(32), ENVIRONMENT: "test", APP_ORIGIN: "http://localhost", DB: {}, ASSETS: {}, PDF_BUCKET: {}, TIMEZONE: "Asia/Ho_Chi_Minh", CMS_SSO_PRIVATE_JWK: "" } as unknown as QuoteAppEnv;

describe("safe request diagnostics", () => {
  it("returns an authentication code and matching request id without exposing secrets", async () => {
    const response = await app.request("http://localhost/api/quotes", {}, env);
    const body = await response.json();
    if (!body || typeof body !== "object" || !("code" in body) || !("requestId" in body)) throw new Error("Missing error fields");
    expect(response.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
    expect(body.requestId).toBe(response.headers.get("X-Request-Id"));
    expect(body.requestId).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain(env.SESSION_SECRET);
  });

  it("correlates a rejected oversized request before authentication", async () => {
    const response = await app.request("http://localhost/api/quotes", { method: "POST", headers: { "Content-Length": String(4 * 1024 * 1024) }, body: "x" }, env);
    const body = await response.json();
    if (!body || typeof body !== "object" || !("code" in body) || !("requestId" in body)) throw new Error("Missing error fields");
    expect(response.status).toBe(413);
    expect(body.code).toBe("PAYLOAD_TOO_LARGE");
    expect(body.requestId).toBe(response.headers.get("X-Request-Id"));
    expect(body.requestId).toBeTruthy();
  });
});
