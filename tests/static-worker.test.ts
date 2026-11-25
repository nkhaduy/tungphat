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

describe("static Worker staging indexability", () => {
  it("serves a disallow-all robots file and noindex header only on staging", async () => {
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
    expect(await robots.text()).toBe("User-agent: *\nDisallow: /\n");
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
