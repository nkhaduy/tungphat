import { describe, expect, it, vi } from "vitest";
import worker from "../workers/static-preview.mjs";

describe("Workers static preview", () => {
  it("adds noindex to static responses including redirects and 404", async () => {
    for (const status of [200, 308, 404]) {
      const response = await worker.fetch(new Request("https://preview.example/foo"), { ASSETS: { fetch: async () => new Response(null, { status }) } });
      expect(response.status).toBe(status);
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    }
  });
  it("proxies catalogue GET to the fixed CMS origin and preserves range", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input as Request;
      expect(request.url).toBe("https://cms.mdftungphat.com/media/catalog/sample.jpg?size=1");
      expect(request.headers.get("range")).toBe("bytes=0-9");
      return new Response("image", { status: 206, headers: { "content-type": "image/jpeg" } });
    });
    try {
      const response = await worker.fetch(new Request("https://preview.example/catalog/sample.jpg?size=1", { headers: { range: "bytes=0-9" } }), { ASSETS: { fetch: vi.fn() } });
      expect(response.status).toBe(206);
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
      expect(await response.text()).toBe("image");
    } finally { fetchSpy.mockRestore(); }
  });
  it("rejects catalogue writes without calling the origin", async () => {
    const response = await worker.fetch(new Request("https://preview.example/catalog/x", { method: "POST" }), { ASSETS: { fetch: vi.fn() } });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
});
