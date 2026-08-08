import { describe, expect, it } from "vitest";
import { onRequest } from "../functions/index";

describe("production admin entry", () => {
  it("serves the canonical custom hostname without changing the URL", async () => {
    let calls = 0;
    const response = await onRequest({
      request: new Request("https://cms.mdftungphat.com/anything?x=1"),
      env: {},
      next: () => { calls += 1; return Promise.resolve(new Response("asset")); },
    } as never);

    expect(calls).toBe(1);
    expect(await response.text()).toBe("asset");
  });

  it("redirects only the production Pages hostname to the canonical custom hostname", async () => {
    const response = await onRequest({
      request: new Request("https://tungphat-light-cms-production.pages.dev/anything?x=1"),
      env: {},
      next: () => Promise.resolve(new Response("asset")),
    } as never);

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("https://cms.mdftungphat.com/anything?x=1");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("serves preview branch hostnames normally", async () => {
    const response = await onRequest({
      request: new Request("https://preview-branch.tungphat-light-cms-production.pages.dev/"),
      env: {},
      next: () => Promise.resolve(new Response("preview")),
    } as never);
    expect(await response.text()).toBe("preview");
  });
});
