import { describe, expect, it } from "vitest";
import { securityHeaders, jsonError, readBoundedJson } from "../src/worker/http";

describe("Worker HTTP security", () => {
  it("sets no-store and defensive headers on API JSON", () => {
    const headers = securityHeaders("request-1");
    expect(headers.get("Cache-Control")).toBe("no-store");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("X-Request-ID")).toBe("request-1");
  });

  it("rejects oversized JSON without buffering an unbounded body", async () => {
    const request = new Request("https://staging.example/api/content", { method: "POST", body: "x".repeat(65_000), headers: { "Content-Length": "65000" } });
    expect(await readBoundedJson(request, 64 * 1024)).toBeNull();
    expect(jsonError("request-1", 413, "payload_too_large").status).toBe(413);
  });
});
