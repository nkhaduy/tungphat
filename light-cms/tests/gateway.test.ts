import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../functions/api/[[path]]";

function context(request: Request, fetcher: (request: Request) => Promise<Response>, legacyOrigin?: string) {
  return { request, env: { LIGHT_CMS_API: { fetch: fetcher }, LEGACY_CMS_ORIGIN: legacyOrigin } } as unknown as Parameters<typeof onRequest>[0];
}

describe("Pages same-origin Access gateway", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards the Access JWT and cookie while stripping unverified identity headers", async () => {
    const upstream: Request[] = [];
    await onRequest(context(new Request("https://staging.example/api/dashboard", { headers: {
      "Cf-Access-Jwt-Assertion": "signed.jwt.token",
      "Cf-Access-Authenticated-User-Email": "forged@example.com",
      "X-Auth-Request-Email": "forged@example.com",
      "X-Forwarded-Email": "forged@example.com",
      Cookie: "CF_Authorization=opaque",
    } }), async (request) => { upstream.push(request); return new Response("ok"); }));
    expect(upstream).toHaveLength(1);
    const forwarded = upstream[0];
    expect(forwarded.headers.get("Cf-Access-Jwt-Assertion")).toBe("signed.jwt.token");
    expect(forwarded.headers.get("Cookie")).toBe("CF_Authorization=opaque");
    expect(forwarded.headers.get("Cf-Access-Authenticated-User-Email")).toBeNull();
    expect(forwarded.headers.get("X-Auth-Request-Email")).toBeNull();
    expect(forwarded.headers.get("X-Forwarded-Email")).toBeNull();
    expect(forwarded.headers.get("X-Light-CMS-Gateway")).toBe("pages-staging");
  });

  it("calls the service binding once and preserves status, body, and response headers", async () => {
    let calls = 0;
    const response = await onRequest(context(new Request("https://staging.example/api/dashboard"), async () => {
      calls += 1;
      return new Response("upstream-body", { status: 418, statusText: "Teapot", headers: { "X-Upstream": "yes", "Cache-Control": "no-store" } });
    }));
    expect(calls).toBe(1);
    expect(response.status).toBe(418);
    expect(response.statusText).toBe("Teapot");
    expect(response.headers.get("X-Upstream")).toBe("yes");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("upstream-body");
  });

  it("does not replace public cache headers with private no-store", async () => {
    const response = await onRequest(context(new Request("https://staging.example/api/public/snapshot"), async () => new Response("public", {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", ETag: '"snapshot"' },
    })));
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60, stale-while-revalidate=300");
    expect(response.headers.get("ETag")).toBe('"snapshot"');
  });

  it("keeps Light CMS routes on the service binding when a legacy origin is configured", async () => {
    const legacyFetch = vi.fn(async () => new Response("legacy"));
    vi.stubGlobal("fetch", legacyFetch);
    let lightCalls = 0;

    const response = await onRequest(context(new Request("https://cms.example/api/media"), async () => {
      lightCalls += 1;
      return new Response("light");
    }, "https://immutable-legacy.pages.dev"));

    expect(lightCalls).toBe(1);
    expect(legacyFetch).not.toHaveBeenCalled();
    expect(await response.text()).toBe("light");
  });

  it("proxies non-Light APIs to the immutable legacy origin without leaking Access credentials", async () => {
    const legacyRequests: Request[] = [];
    vi.stubGlobal("fetch", async (request: Request) => {
      legacyRequests.push(request);
      return new Response("accepted", { status: 202, headers: { "X-Legacy": "yes" } });
    });
    let lightCalls = 0;
    const request = new Request("https://cms.example/api/contact?source=footer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cf-Access-Jwt-Assertion": "signed.jwt.token",
        "Cf-Access-Authenticated-User-Email": "admin@example.com",
        Cookie: "CF_Authorization=access-cookie; legacy_session=keep-me",
      },
      body: JSON.stringify({ name: "Tung Phat" }),
    });

    const response = await onRequest(context(request, async () => {
      lightCalls += 1;
      return new Response("light");
    }, "https://immutable-legacy.pages.dev/"));

    expect(lightCalls).toBe(0);
    expect(legacyRequests).toHaveLength(1);
    const forwarded = legacyRequests[0];
    expect(forwarded.url).toBe("https://immutable-legacy.pages.dev/api/contact?source=footer");
    expect(forwarded.method).toBe("POST");
    expect(forwarded.headers.get("Content-Type")).toBe("application/json");
    expect(forwarded.headers.get("Cf-Access-Jwt-Assertion")).toBeNull();
    expect(forwarded.headers.get("Cf-Access-Authenticated-User-Email")).toBeNull();
    expect(forwarded.headers.get("Cookie")).toBe("legacy_session=keep-me");
    expect(await forwarded.text()).toBe(JSON.stringify({ name: "Tung Phat" }));
    expect(response.status).toBe(202);
    expect(response.headers.get("X-Legacy")).toBe("yes");
    expect(await response.text()).toBe("accepted");
  });
});
