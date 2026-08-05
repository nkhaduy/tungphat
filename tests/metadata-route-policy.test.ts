import { describe, expect, it } from "vitest";
import {
  indexableMetadataRoutes,
  noindexMetadataRoutes,
} from "../scripts/lib/metadata-route-policy.mjs";

describe("static metadata route policy", () => {
  it("audits the canonical Thanh Thuy route without requiring the retired placeholder", () => {
    expect(indexableMetadataRoutes).toContain("/thuong-hieu/thanh-thuy/");
    expect(noindexMetadataRoutes).not.toContain("/san-pham/thanh-thuy/");
  });

  it("keeps current An Cuong and generic brand placeholders noindex", () => {
    expect(noindexMetadataRoutes).toEqual(
      expect.arrayContaining([
        "/catalogue/an-cuong/",
        "/san-pham/an-cuong/",
        "/san-pham/ba-thanh/",
        "/san-pham/kes/",
      ]),
    );
  });
});
