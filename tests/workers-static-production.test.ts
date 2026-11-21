import { describe, expect, it, vi } from "vitest";
import worker from "../workers/static-production.mjs";

describe("Workers production assets handler", () => {
  it("streams catalogue ranges from the fixed CMS origin without adding noindex", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input as Request;
      expect(request.url).toBe("https://cms.mdftungphat.com/media/catalog/item.webp?v=1");
      expect(request.headers.get("range")).toBe("bytes=0-9");
      return new Response("image", { status: 206, headers: { "content-type": "image/webp", "content-range": "bytes 0-4/20" } });
    });
    try {
      const response = await worker.fetch(new Request("https://example.org/catalog/item.webp?v=1", { headers: { range: "bytes=0-9" } }), { ASSETS: { fetch: vi.fn() } });
      expect(response.status).toBe(206);
      expect(response.headers.get("content-range")).toBe("bytes 0-4/20");
      expect(response.headers.get("x-robots-tag")).toBeNull();
      expect(await response.text()).toBe("image");
    } finally { fetchSpy.mockRestore(); }
  });
  it("delegates missing assets and preserves their status and headers", async () => {
    const response = await worker.fetch(new Request("https://example.org/missing"), { ASSETS: { fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/html" } }) } });
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });
  it("rejects catalogue writes", async () => {
    const response = await worker.fetch(new Request("https://example.org/catalog/x", { method: "POST" }), { ASSETS: { fetch: vi.fn() } });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
  });
});

it("allows the same public CSP connection origins as Vercel", async () => {
  const { readFile } = await import("node:fs/promises");
  const headers = await readFile("public/_headers", "utf8");
  const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
  const expected = vercel.headers[0].headers.find((entry: { key: string }) => entry.key === "Content-Security-Policy").value as string;
  const actual = headers.match(/^\s+Content-Security-Policy: (.+)$/m)?.[1] ?? "";
  const directive = (policy: string) => policy.split(";").find((part) => part.trim().startsWith("connect-src "))?.trim();
  expect(directive(actual)).toBe(directive(expected));
});

it("rejects preview noindex headers when preparing production assets", async () => {
  const { assertProductionHeaders } = await import("../scripts/prepare-workers-production-artifact.mjs");
  expect(() => assertProductionHeaders("/*\n  X-Robots-Tag: noindex, nofollow\n")).toThrow();
  expect(() => assertProductionHeaders("https://example.org/*\n  X-Robots-Tag: noindex\n")).toThrow();
  expect(() => assertProductionHeaders("/*\n  X-Content-Type-Options: nosniff\n\n/cms-preview/*\n  X-Robots-Tag: noindex\n")).not.toThrow();
});

it("forwards only analytics POST to the fixed CMS endpoint without cookies", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const req = input as Request;
    expect(req.url).toBe("https://cms.mdftungphat.com/api/analytics/track");
    expect(req.method).toBe("POST");
    expect(req.headers.get("cookie")).toBeNull();
    expect(await req.text()).toBe('{"event":"page_view"}');
    return new Response(null, { status: 201 });
  });
  try {
    const response = await worker.fetch(new Request("https://gotungphat.com/api/analytics/track", { method: "POST", headers: { "content-type": "text/plain", cookie: "private=session" }, body: '{"event":"page_view"}' }), { ASSETS: { fetch: vi.fn() } });
    expect(response.status).toBe(201);
  } finally { fetchSpy.mockRestore(); }
});
