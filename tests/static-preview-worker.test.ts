import { afterEach, describe, expect, it, vi } from "vitest";
import previewWorker from "../workers/static-preview.mjs";

describe("isolated static preview Worker", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("blocks indexing and hides its media allowlist", async () => {
    const assets = { fetch: vi.fn(async () => new Response("[]", { status: 200 })) };
    const env = { ASSETS: assets } as never;
    const robots = await previewWorker.fetch(new Request("https://preview.example/robots.txt"), env);
    expect(await robots.text()).toContain("Disallow: /");
    expect(robots.headers.get("X-Robots-Tag")).toContain("noindex");
    expect((await previewWorker.fetch(new Request("https://preview.example/sitemap.xml"), env)).status).toBe(404);
    expect((await previewWorker.fetch(new Request("https://preview.example/_preview-media-allowlist.json"), env)).status).toBe(404);
  });

  it("proxies only allowlisted staged uploads using safe request headers", async () => {
    const assets = { fetch: vi.fn(async () => new Response(JSON.stringify(["/uploads/published.webp"]), { status: 200 })) };
    const upstream = vi.fn(async () => new Response("image-bytes", { status: 200, headers: { "Content-Type": "image/webp" } }));
    vi.stubGlobal("fetch", upstream);
    const request = new Request("https://preview.example/uploads/published.webp", { headers: { Cookie: "session=private", Accept: "image/webp" } });
    const previewSecret = "S".repeat(64);
    const response = await previewWorker.fetch(request, { ASSETS: assets, SITE_PREVIEW_MEDIA_SECRET: previewSecret } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
    const proxied = upstream.mock.calls[0]?.[0] as Request;
    expect(new URL(proxied.url).hostname).toBe("tungphat-payload-cms-staging.nkhaduy.workers.dev");
    expect(proxied.headers.has("cookie")).toBe(false);
    expect(proxied.headers.get("authorization")).toBe(`Bearer ${previewSecret}`);

    upstream.mockClear();
    const blocked = await previewWorker.fetch(new Request("https://preview.example/uploads/draft.webp"), { ASSETS: assets, SITE_PREVIEW_MEDIA_SECRET: previewSecret } as never);
    expect(blocked.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();

    const unconfigured = await previewWorker.fetch(request, { ASSETS: assets } as never);
    expect(unconfigured.status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });
});
