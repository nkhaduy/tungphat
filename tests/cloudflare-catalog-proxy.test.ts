import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../functions/catalog/[[path]]";

async function serve(path: string, method = "GET") {
  return onRequest({ request: new Request(`https://mdftungphat.com${path}`, { method }) } as Parameters<typeof onRequest>[0]);
}

afterEach(() => vi.unstubAllGlobals());

describe("Cloudflare legacy catalogue media", () => {
  it("streams the actual upstream media and preserves range and cache validators", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const fetcher = vi.fn(async (request: Request) => {
      expect(request.method).toBe("GET");
      return new Response(bytes, { status: 206, headers: { "Content-Type": "image/jpeg", "Content-Range": "bytes 0-4/900", ETag: '"real-image"' } });
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await serve("/catalog/thanh-thuy/101.jpg?version=2");
    expect(result.status).toBe(206);
    expect(result.headers.get("content-type")).toBe("image/jpeg");
    expect(result.headers.get("etag")).toBe('"real-image"');
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(bytes);
    expect(new URL(fetcher.mock.calls[0][0].url).href).toBe("https://cms.mdftungphat.com/media/catalog/thanh-thuy/101.jpg?version=2");
  });

  it("preserves a missing image as 404", async () => {
    vi.stubGlobal("fetch", async () => new Response("Missing", { status: 404 }));
    expect((await serve("/catalog/not-present.jpg")).status).toBe(404);
  });

  it("does not forward browser cookies or authorization to media", async () => {
    const fetcher = vi.fn(async (request: Request) => {
      expect(request.headers.has("cookie")).toBe(false);
      expect(request.headers.has("authorization")).toBe(false);
      expect(request.headers.get("range")).toBe("bytes=0-4");
      return new Response(null);
    });
    vi.stubGlobal("fetch", fetcher);
    await onRequest({ request: new Request("https://mdftungphat.com/catalog/a.jpg", { headers: { cookie: "session=private", authorization: "Bearer private", range: "bytes=0-4" } }) } as Parameters<typeof onRequest>[0]);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns an empty HEAD response and rejects writes", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { headers: { "Content-Length": "50" } }));
    const head = await serve("/catalog/a.jpg", "HEAD");
    expect(await head.text()).toBe("");
    expect(head.headers.get("content-length")).toBe("50");
    expect((await serve("/catalog/a.jpg", "POST")).status).toBe(405);
  });
});
