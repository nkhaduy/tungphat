import { describe, expect, it } from "vitest";
import { payloadCollectionOrigin } from "@/lib/content";

describe("Payload collection origins for static editorial builds", () => {
  it("ignores a staging CMS override for production builds", () => {
    expect(payloadCollectionOrigin("articles", "https://cms.mdftungphat.com", "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/"))
      .toBe("https://cms.mdftungphat.com");
  });

  it("uses the isolated CMS for every collection in an explicit preview build", () => {
    expect(payloadCollectionOrigin("articles", "https://cms.mdftungphat.com", "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/", "preview"))
      .toBe("https://tungphat-payload-cms-staging.nkhaduy.workers.dev");
    for (const collection of ["products", "projects", "pages"]) {
      expect(payloadCollectionOrigin(collection, "https://cms.mdftungphat.com", "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/", "preview"))
        .toBe("https://tungphat-payload-cms-staging.nkhaduy.workers.dev");
    }
  });

  it("rejects a production CMS origin for every preview collection", () => {
    for (const collection of ["articles", "products", "projects", "pages"]) {
      expect(() => payloadCollectionOrigin(collection, "https://cms.mdftungphat.com", "https://cms.mdftungphat.com", "preview"))
        .toThrow(/isolated staging CMS/i);
    }
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
