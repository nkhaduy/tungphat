import { describe, expect, it } from "vitest";
import {
  canonicalMetadataRoutes,
  indexableMetadataRoutes,
  noindexMetadataRoutes,
} from "../scripts/lib/metadata-route-policy.mjs";

describe("static metadata route policy", () => {
  it("audits the canonical Thanh Thuy route without requiring the retired placeholder", () => {
    expect(indexableMetadataRoutes).toContain("/thuong-hieu/thanh-thuy/");
    expect(noindexMetadataRoutes).not.toContain("/san-pham/thanh-thuy/");
  });

  it("keeps product-family brand pages separate from public color-code hubs", () => {
    expect(noindexMetadataRoutes).toEqual(
      expect.arrayContaining([
        "/san-pham/an-cuong/",
        "/san-pham/ba-thanh/",
        "/san-pham/kes/",
      ]),
    );
    expect(indexableMetadataRoutes).toEqual(expect.arrayContaining([
      "/catalogue/an-cuong/",
      "/catalogue/ba-thanh/",
      "/catalogue/thanh-thuy/",
    ]));
  });

  it("treats the retired Ba Thanh Melamine hub as a canonicalized noindex alias", () => {
    const legacyRoute = "/ma-mau-melamine/ba-thanh/";

    expect(noindexMetadataRoutes).toContain(legacyRoute);
    expect(indexableMetadataRoutes).not.toContain(legacyRoute);
    expect(canonicalMetadataRoutes[legacyRoute]).toBe(
      "/catalogue/ba-thanh/melamine/",
    );
  });
});
