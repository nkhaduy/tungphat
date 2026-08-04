import { describe, expect, it } from "vitest";
import { createHttpClient, assertAllowedUrl, SourceBlockedError } from "@/scripts/ancuong/http-client";

describe("An Cuong HTTP client", () => {
  it("rejects non-catalogue hosts and editorial paths", () => {
    expect(() => assertAllowedUrl("https://example.com/material.html")).toThrow(/host/i);
    expect(() => assertAllowedUrl("https://ancuong.com/tin-tuc/example.html")).toThrow(/scope/i);
    expect(() => assertAllowedUrl("https://ancuong.com/melamine/303003307.html")).not.toThrow();
  });

  it("retries retryable responses and returns the successful body", async () => {
    let attempts = 0;
    const client = createHttpClient({
      maxRetries: 3,
      minDelayMs: 0,
      maxDelayMs: 0,
      fetchImpl: async () => {
        attempts += 1;
        if (attempts < 3) return new Response("busy", { status: 503 });
        return new Response("ok", { status: 200, headers: { "content-type": "text/html" } });
      }
    });
    const result = await client.fetchText("https://ancuong.com/melamine.html");
    expect(result.body).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("stops safely on an anti-bot challenge", async () => {
    const client = createHttpClient({
      minDelayMs: 0,
      maxDelayMs: 0,
      fetchImpl: async () => new Response("Just a moment... cf-chl-captcha", { status: 403 })
    });
    await expect(client.fetchText("https://ancuong.com/melamine.html")).rejects.toBeInstanceOf(SourceBlockedError);
  });
});
