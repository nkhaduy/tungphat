import { describe, expect, it } from "vitest";
import { onRequest } from "../functions/index";

describe("production admin entry", () => {
  it("redirects the external-DNS custom hostname to the Access-protected Pages hostname", async () => {
    const next = () => Promise.resolve(new Response("asset"));
    const response = await onRequest({
      request: new Request("https://cms.mdftungphat.com/"),
      env: { ACCESS_ADMIN_ORIGIN: "https://tungphat-light-cms-production.pages.dev" },
      next,
    } as never);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://tungphat-light-cms-production.pages.dev/");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("serves the SPA normally on the Access-protected Pages hostname", async () => {
    const response = await onRequest({
      request: new Request("https://tungphat-light-cms-production.pages.dev/"),
      env: { ACCESS_ADMIN_ORIGIN: "https://tungphat-light-cms-production.pages.dev" },
      next: () => Promise.resolve(new Response("asset")),
    } as never);

    expect(await response.text()).toBe("asset");
  });
});
