import { describe, expect, it, vi } from "vitest";
import { fetchPublishedWordPressPosts } from "@/lib/wordpress/posts";
import { createServer } from "node:http";

const post = { id: 1, slug: "go-ghep-la-gi", status: "publish", date_gmt: "2026-01-01T00:00:00", modified_gmt: "2026-01-02T00:00:00", title: { rendered: "Gỗ ghép" }, excerpt: { rendered: "<p>Tìm hiểu gỗ ghép</p>" }, content: { rendered: "<p>Bài viết</p>" }, featured_media: 0 };
function response(data: unknown, pages = "1") { return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json", "X-WP-TotalPages": pages } }); }
describe("WordPress public build adapter", () => {
  it("loads all pages and excludes non-public statuses", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response([post, { ...post, id: 2, slug: "draft", status: "draft" }], "2")).mockResolvedValueOnce(response([{ ...post, id: 3, slug: "second" }], "2"));
    const posts = await fetchPublishedWordPressPosts("https://example.org", fetcher);
    expect(posts.map((p) => p.slug)).toEqual(["go-ghep-la-gi", "second"]);
    expect(posts[0].canonical).toBe("https://mdftungphat.com/bai-viet/go-ghep-la-gi/");
  });
  it("fails closed on unavailable API or duplicate slug", async () => {
    await expect(fetchPublishedWordPressPosts("https://example.org", vi.fn().mockResolvedValue(new Response("", { status: 503 })))).rejects.toThrow();
    await expect(fetchPublishedWordPressPosts("https://example.org", vi.fn().mockResolvedValue(response([post, { ...post, id: 4 }])))).rejects.toThrow(/duplicate/i);
  });
  it("never exposes password protected or future posts", async () => {
    const data = [post, { ...post, id: 2, slug: "future", status: "future" }, { ...post, id: 3, slug: "private", status: "private" }, { ...post, id: 4, slug: "protected", content: { rendered: "", protected: true } }];
    const result = await fetchPublishedWordPressPosts("https://example.org", vi.fn().mockResolvedValue(response(data)));
    expect(result.map((p) => p.slug)).toEqual(["go-ghep-la-gi"]);
  });
});

it("fails closed when the real HTTP server does not respond", async () => {
  const server = createServer(() => {});
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP server");
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(() => originalTimeout(50));
  try {
    await expect(fetchPublishedWordPressPosts(`http://127.0.0.1:${address.port}`, fetch, { allowInsecureLoopback: true })).rejects.toThrow();
  } finally {
    timeout.mockRestore();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

it("reflects updates, unpublishing, and removal on a new build", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(response([post])).mockResolvedValueOnce(response([{ ...post, title: { rendered: "Updated" }, modified_gmt: "2026-02-01T00:00:00" }])).mockResolvedValueOnce(response([{ ...post, status: "draft" }])).mockResolvedValueOnce(response([]));
  expect((await fetchPublishedWordPressPosts("https://example.org", fetcher))[0].titleHtml).toBe("Gỗ ghép");
  expect((await fetchPublishedWordPressPosts("https://example.org", fetcher))[0].titleHtml).toBe("Updated");
  expect(await fetchPublishedWordPressPosts("https://example.org", fetcher)).toEqual([]);
  expect(await fetchPublishedWordPressPosts("https://example.org", fetcher)).toEqual([]);
});

it("rejects unsafe WordPress origins before fetching", async () => {
  const fetcher = vi.fn();
  await expect(fetchPublishedWordPressPosts("http://example.org", fetcher)).rejects.toThrow(/HTTPS/);
  expect(fetcher).not.toHaveBeenCalled();
});

it("fails instead of silently truncating when pagination headers are missing", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([post]), { status: 200 }));
  await expect(fetchPublishedWordPressPosts("https://example.org", fetcher)).rejects.toThrow(/pagination/i);
});

it("uses a distinct cache key for each static build request", async () => {
  const fetcher = vi.fn().mockImplementation(async () => response([post]));
  await fetchPublishedWordPressPosts("https://example.org", fetcher);
  await fetchPublishedWordPressPosts("https://example.org", fetcher);
  expect(String(fetcher.mock.calls[0][0])).not.toBe(String(fetcher.mock.calls[1][0]));
  expect(fetcher.mock.calls[0][1].cache).toBe("force-cache");
});

it("bounds each WordPress request with an abort signal", async () => {
  const timeout = vi.spyOn(AbortSignal, "timeout");
  const fetcher = vi.fn().mockImplementation(async (_url, options) => {
    expect(options.signal).toBeInstanceOf(AbortSignal);
    return response([post]);
  });
  try {
    await fetchPublishedWordPressPosts("https://example.org", fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(timeout).toHaveBeenCalledWith(15_000);
  } finally {
    timeout.mockRestore();
  }
});
