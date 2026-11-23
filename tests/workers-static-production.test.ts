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

it("removes the staging CMS origin from production response policy only", async () => {
  const { sanitizeProductionHeaders } = await import("../scripts/prepare-workers-production-artifact.mjs");
  const input = "/*\n  Content-Security-Policy: img-src 'self'; frame-ancestors 'self' https://cms.mdftungphat.com https://tungphat-payload-cms-staging.nkhaduy.workers.dev;\n\n/cms-preview/*\n  X-Robots-Tag: noindex\n";
  const output = sanitizeProductionHeaders(input);
  expect(output).not.toContain("tungphat-payload-cms-staging");
  expect(output).toContain("https://cms.mdftungphat.com");
  expect(output).toContain("/cms-preview/*\n  X-Robots-Tag: noindex");
});

it("keeps production asset routing aligned with the currently deployed Worker", async () => {
  const { readFile } = await import("node:fs/promises");
  const config = await readFile("wrangler.static-production.jsonc", "utf8");
  expect(config).toMatch(/"name":\s*"tungphat-static-assets"/u);
  expect(config).toMatch(/"run_worker_first":\s*\[\s*"\/catalog\/\*",\s*"\/api\/analytics\/track"\s*\]/u);
  expect(config).toMatch(/"directory":\s*"\.\/\.wrangler\/workers-production-assets"/u);
  expect(config).toMatch(/"workers_dev":\s*false/u);
});

it("provides distinct build and deploy commands for the production Workers Build", async () => {
  const { readFile } = await import("node:fs/promises");
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as { scripts: Record<string, string> };
  expect(packageJson.scripts["workers:production:build"]).toBe("tsx scripts/workers-build-production.ts build");
  expect(packageJson.scripts["workers:production:deploy"]).toBe("tsx scripts/workers-build-production.ts deploy");
});
