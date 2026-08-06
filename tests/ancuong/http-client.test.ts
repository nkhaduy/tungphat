import { describe, expect, it } from "vitest";
import { createHttpClient, assertAllowedUrl, SourceBlockedError } from "@/scripts/ancuong/http-client";

describe("An Cuong HTTP client", () => {
  it("rejects non-catalogue hosts and editorial paths", () => {
    expect(() => assertAllowedUrl("https://example.com/material.html")).toThrow(/host/i);
    expect(() => assertAllowedUrl("http://ancuong.com/material.html")).toThrow(/https/i);
    expect(() => assertAllowedUrl("https://ancuong.com/tin-tuc/example.html")).toThrow(/scope/i);
    expect(() => assertAllowedUrl("https://ancuong.com/melamine/303003307.html")).not.toThrow();
  });

  it("rejects a redirect before requesting a host outside the allowlist", async () => {
    const requested: string[] = [];
    const client = createHttpClient({
      minDelayMs: 0,
      maxDelayMs: 0,
      fetchImpl: async (input) => {
        requested.push(input.toString());
        return new Response(null, {
          status: 302,
          headers: { location: "http://127.0.0.1/internal" },
        });
      },
    });

    await expect(
      client.fetchText("https://ancuong.com/melamine.html"),
    ).rejects.toThrow(/host|https/i);
    expect(requested).toEqual(["https://ancuong.com/melamine.html"]);
  });

  it("follows an allowlisted HTTPS redirect manually", async () => {
    const requested: string[] = [];
    const client = createHttpClient({
      minDelayMs: 0,
      maxDelayMs: 0,
      fetchImpl: async (input) => {
        const url = input.toString();
        requested.push(url);
        if (url === "https://ancuong.com/melamine.html") {
          return new Response(null, {
            status: 302,
            headers: { location: "https://www.ancuong.com/melamine.html" },
          });
        }
        return new Response("ok", { status: 200 });
      },
    });

    await expect(
      client.fetchText("https://ancuong.com/melamine.html"),
    ).resolves.toMatchObject({ body: "ok", status: 200 });
    expect(requested).toEqual([
      "https://ancuong.com/melamine.html",
      "https://www.ancuong.com/melamine.html",
    ]);
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

  it("spaces successful requests from the same client", async () => {
    const sleeps: number[] = [];
    const client = createHttpClient({
      minDelayMs: 300,
      maxDelayMs: 300,
      sleepImpl: async (milliseconds) => { sleeps.push(milliseconds); },
      fetchImpl: async () => new Response("ok", { status: 200 }),
    });
    await client.fetchText("https://ancuong.com/melamine.html");
    await client.fetchText("https://ancuong.com/laminate.html");
    expect(sleeps).toEqual([300]);
  });

  it("retrieves binary media with the same user agent and retry policy", async () => {
    let attempts = 0;
    let userAgent = "";
    const client = createHttpClient({
      minDelayMs: 0,
      maxDelayMs: 0,
      fetchImpl: async (_input, init) => {
        attempts += 1;
        userAgent = new Headers(init?.headers).get("user-agent") ?? "";
        if (attempts === 1) return new Response("busy", { status: 503 });
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } });
      },
    });
    const result = await client.fetchBytes("https://ancuong.com/products/example.png");
    expect([...result.body]).toEqual([1, 2, 3]);
    expect(result.contentType).toBe("image/png");
    expect(attempts).toBe(2);
    expect(userAgent).toContain("TungPhat-AnCuong-Catalogue-Crawler");
  });
});
