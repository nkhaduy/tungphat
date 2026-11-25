import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../workers/static-production.mjs";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("static Worker analytics forwarding", () => {
  it("uses the configured production origin when no service binding is present", async () => {
    const networkResponse = new Response("accepted", { status: 201 });
    const networkFetch = vi.fn(async () => networkResponse);
    vi.stubGlobal("fetch", networkFetch);

    const response = await worker.fetch(
      new Request("https://production.example/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: "page_view" }),
      }),
      {
        ASSETS: { fetch: vi.fn() },
        ANALYTICS_ORIGIN: "https://cms.mdftungphat.com",
      },
    );

    expect(networkFetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);
    const upstream = networkFetch.mock.calls[0][0];
    expect(upstream.url).toBe("https://cms.mdftungphat.com/api/analytics/track");
    expect(upstream.method).toBe("POST");
  });

  it("uses the isolated CMS service binding when configured", async () => {
    const serviceResponse = new Response("accepted", { status: 201 });
    const serviceFetch = vi.fn(async () => serviceResponse);
    const networkFetch = vi.fn(async () => new Response("wrong upstream", { status: 503 }));
    vi.stubGlobal("fetch", networkFetch);

    const response = await worker.fetch(
      new Request("https://staging.example/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: "page_view" }),
      }),
      {
        ASSETS: { fetch: vi.fn() },
        ANALYTICS_ORIGIN: "https://tungphat-payload-cms-staging.nkhaduy.workers.dev",
        ANALYTICS_SERVICE: { fetch: serviceFetch },
        RELEASE_STAGING: "true",
      },
    );

    expect(serviceFetch).toHaveBeenCalledTimes(1);
    expect(networkFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(await response.text()).toBe("accepted");
    const upstream = serviceFetch.mock.calls[0][0];
    expect(upstream.url).toBe(
      "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/api/analytics/track",
    );
    expect(upstream.method).toBe("POST");
  });

  it("pins staging analytics to the isolated CMS if its service binding is absent", async () => {
    const networkResponse = new Response("accepted", { status: 201 });
    const networkFetch = vi.fn(async () => networkResponse);
    vi.stubGlobal("fetch", networkFetch);

    await worker.fetch(
      new Request("https://staging.example/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: "page_view" }),
      }),
      {
        ASSETS: { fetch: vi.fn() },
        ANALYTICS_ORIGIN: "https://cms.mdftungphat.com",
        RELEASE_STAGING: "true",
      },
    );

    expect(networkFetch).toHaveBeenCalledTimes(1);
    const upstream = networkFetch.mock.calls[0][0];
    expect(upstream.url).toBe(
      "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/api/analytics/track",
    );
  });
});

describe("static Worker proxy response headers", () => {
  it("keeps shared security headers and noindex on analytics/media proxy responses", async () => {
    const networkFetch = vi.fn(async () => new Response("ok", { status: 201 }));
    vi.stubGlobal("fetch", networkFetch);

    const analytics = await worker.fetch(
      new Request("https://gotungphat.com/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: "page_view" }),
      }),
      {
        ASSETS: { fetch: vi.fn() },
        ANALYTICS_ORIGIN: "https://cms.mdftungphat.com",
      },
    );

    const media = await worker.fetch(
      new Request("https://gotungphat.com/catalog/test.webp"),
      {
        ASSETS: { fetch: vi.fn() },
        MEDIA_ORIGIN: "https://cms.mdftungphat.com",
      },
    );

    for (const response of [analytics, media]) {
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(response.headers.get("Permissions-Policy")).toBe(
        "camera=(), microphone=(), geolocation=()",
      );
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000; includeSubDomains",
      );
      expect(response.headers.get("Content-Security-Policy")).toContain(
        "default-src 'self'",
      );
    }

    expect(analytics.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(analytics.headers.get("Cache-Control")).toBe("no-store");
    expect(networkFetch).toHaveBeenCalledTimes(2);
  });
});

describe("static Worker staging indexability", () => {
  it("lets crawlers read staging noindex headers without publishing a sitemap", async () => {
    const assetsFetch = vi.fn(
      async () =>
        new Response("<main>Trang kiểm thử</main>", {
          headers: { "Content-Type": "text/html" },
        }),
    );
    const env = { ASSETS: { fetch: assetsFetch }, RELEASE_STAGING: "true" };

    const robots = await worker.fetch(
      new Request("https://staging.example/robots.txt"),
      env,
    );
    expect(robots.status).toBe(200);
    expect(await robots.text()).toBe("User-agent: *\nAllow: /\n");
    expect(robots.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(assetsFetch).not.toHaveBeenCalled();

    const page = await worker.fetch(new Request("https://staging.example/"), env);
    expect(page.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");

    const production = await worker.fetch(
      new Request("https://gotungphat.com/"),
      {
        ASSETS: {
          fetch: vi.fn(
            async () =>
              new Response("<main>Trang kiểm thử</main>", {
                headers: { "Content-Type": "text/html" },
              }),
          ),
        },
      },
    );
    expect(production.headers.get("X-Robots-Tag")).toBeNull();
  });
});
