import { describe, expect, it } from "vitest";
import { payloadCollectionOrigin } from "@/lib/content";

describe("Payload collection origins for static editorial builds", () => {
  it("ignores a staging CMS override for production builds", () => {
    expect(payloadCollectionOrigin("articles", "https://cms.mdftungphat.com", "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/"))
      .toBe("https://cms.mdftungphat.com");
  });

  it("uses the isolated CMS only for an explicit preview build", () => {
    expect(payloadCollectionOrigin("articles", "https://cms.mdftungphat.com", "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/", "preview"))
      .toBe("https://tungphat-payload-cms-staging.nkhaduy.workers.dev");
  });

  it("keeps every other collection on the default CMS", () => {
    expect(payloadCollectionOrigin("products", "https://cms.mdftungphat.com", "https://tungphat-payload-cms-staging.nkhaduy.workers.dev"))
      .toBe("https://cms.mdftungphat.com");
  });

  it("falls back to production articles when no isolated origin is configured", () => {
    expect(payloadCollectionOrigin("articles", "https://cms.mdftungphat.com", ""))
      .toBe("https://cms.mdftungphat.com");
  });
});
