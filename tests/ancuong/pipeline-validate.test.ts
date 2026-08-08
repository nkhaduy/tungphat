import { describe, expect, it } from "vitest";
import { buildKnownProductCoverage, productIdsFromDiscoveryManifest, validateCatalogue } from "../../scripts/ancuong/validate";

const validProduct = {
  source: "ancuong",
  sourceUrl: "https://ancuong.com/melamine/303000103.html",
  sourceId: "103",
  name: "MS 103",
  productCode: "MFC - MS 103 SMM",
  normalizedProductCode: "MFC - MS 103 SMM",
  category: "Melamine",
  categorySlug: "melamine",
  dimensions: ["1220x2440"],
  colors: ["Nau"],
  surfaces: ["SMM"],
  surfaceEffects: [],
  specialFeatures: [],
  collections: [],
  solutions: [],
  edgeBandingTypes: [],
  profiles: [],
  standards: [],
  features: [],
  descriptions: {},
  gallery: [],
  relatedProducts: [],
  sameColorProducts: [],
  applicationProducts: [],
  discoveredAt: "2026-08-04T00:00:00.000Z",
  fetchedAt: "2026-08-04T00:00:00.000Z",
  sourceHash: "a".repeat(64),
  normalizedHash: "b".repeat(64),
  parserVersion: "1.0.0",
  status: "active",
  contentUsageStatus: "technical-data",
};

describe("An Cuong validation", () => {
  it("excludes explicitly rejected custom 404 URLs from the imported-product coverage set", () => {
    expect(buildKnownProductCoverage([
      { sourceId: "1", sourceUrl: "https://ancuong.com/melamine/1.html" },
      { sourceId: "2", sourceUrl: "https://ancuong.com/eco-veneer/2.html" },
    ], [{
      sourceId: "2",
      sourceUrl: "https://ancuong.com/eco-veneer/2.html",
      reason: "The sitemap URL resolved to the supplier custom 404 page",
    }])).toEqual({
      knownProductIds: ["1"],
      knownProductUrls: ["https://ancuong.com/melamine/1.html"],
    });
  });

  it("derives discovered product IDs from committed manifest URLs", () => {
    expect(productIdsFromDiscoveryManifest({
      productUrls: [
        "https://ancuong.com/melamine/303000812.html",
        "https://ancuong.com/chi-dan-canh-pvc/303000218.html",
        "https://ancuong.com/melamine/not-a-product.html",
      ],
    })).toEqual(["303000812", "303000218"]);
  });

  it("rejects an empty normalized catalogue", () => {
    const result = validateCatalogue({ products: [] });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("PRODUCTS_EMPTY");
  });

  it("accepts a minimal valid technical product", () => {
    const result = validateCatalogue({ products: [validProduct] });
    expect(result.valid).toBe(true);
    expect(result.summary).toEqual(expect.objectContaining({ products: 1, errors: 0 }));
  });

  it("accepts a verified non-numeric product route when the public page provides a real code", () => {
    const result = validateCatalogue({
      products: [{
        ...validProduct,
        sourceId: undefined,
        sourceUrl: "https://ancuong.com/laminate/fine-weave-ivory.html",
        productCode: "LK 4617 A",
        normalizedProductCode: "LK 4617 A",
      }],
    });

    expect(result.valid).toBe(true);
  });

  it("rejects a canonical full import that is still limited to seven products", () => {
    const products = Array.from({ length: 7 }, (_, index) => ({
      ...validProduct,
      sourceId: String(index + 1),
      sourceUrl: `https://ancuong.com/melamine/${index + 1}.html`,
    }));
    const result = validateCatalogue({
      products,
      knownProductIds: products.map((product) => product.sourceId),
      requireCompleteCoverage: true,
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("FULL_IMPORT_SAMPLE_LIMIT");
  });

  it("rejects canonical full output when a discovered product URL is unaccounted", () => {
    const result = validateCatalogue({
      products: [validProduct],
      knownProductIds: ["103", "104"],
      requireCompleteCoverage: true,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "DISCOVERY_COVERAGE_INCOMPLETE" }),
    ]));
  });

  it("counts relation-only SKU records as accounted discovered product IDs", () => {
    const result = validateCatalogue({
      products: [validProduct],
      knownProductIds: ["103", "104"],
      accountedProductIds: ["104"],
      requireCompleteCoverage: true,
    });

    expect(result.issues.map((issue) => issue.code)).not.toContain("DISCOVERY_COVERAGE_INCOMPLETE");
  });

  it("rejects canonical full output when a discovered code-only product URL is missing", () => {
    const result = validateCatalogue({
      products: [validProduct],
      knownProductUrls: [
        validProduct.sourceUrl,
        "https://ancuong.com/laminate/fine-weave-ivory.html",
      ],
      requireCompleteCoverage: true,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "DISCOVERY_URL_COVERAGE_INCOMPLETE" }),
    ]));
  });

  it("accepts real SSR product and material relation URL patterns", () => {
    const result = validateCatalogue({
      products: [validProduct],
      relations: [{
        relationType: "same-line",
        sourceId: "103",
        sourceUrl: validProduct.sourceUrl,
        targetSourceUrl: "https://ancuong.com/melamine/van-dam-phu-melamine.html",
      }],
    });
    expect(result.valid).toBe(true);
  });

  it("validates relation identity by target and resolves product targets against discovery", () => {
    const result = validateCatalogue({
      products: [validProduct],
      knownProductIds: ["103", "999"],
      relations: [
        { relationType: "same-line", sourceId: "103", sourceUrl: validProduct.sourceUrl, targetSourceUrl: "https://ancuong.com/melamine/line-a.html" },
        { relationType: "same-line", sourceId: "103", sourceUrl: validProduct.sourceUrl, targetSourceUrl: "https://ancuong.com/melamine/line-b.html" },
        { relationType: "same-color", sourceId: "103", sourceUrl: validProduct.sourceUrl, targetSourceId: "999", targetSourceUrl: "https://ancuong.com/melamine/999.html" },
        { relationType: "application", sourceId: "103", sourceUrl: validProduct.sourceUrl, targetSourceId: "album-1", targetSourceUrl: "https://ancuong.com/album-product/1" },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects out-of-scope URLs, HTML/script leakage and secrets", () => {
    const result = validateCatalogue({
      products: [{
        ...validProduct,
        sourceUrl: "https://ancuong.com/tin-tuc/noi-dung.html",
        descriptions: { sourceTechnical: "<script>alert(1)</script> lien he hotline" },
        accessToken: "secret-token",
        sourceMetadata: { cookie: "private-session" },
      }],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "URL_OUT_OF_SCOPE",
      "HTML_LEAK",
      "SECRET_FIELD",
    ]));
    expect(result.issues.filter((issue) => issue.code === "SECRET_FIELD")).toHaveLength(2);
  });

  it("rejects duplicate identities, malformed relations and invalid media", () => {
    const duplicate = { ...validProduct, sourceUrl: "https://ancuong.com/melamine/303000104.html" };
    const result = validateCatalogue({
      products: [validProduct, duplicate],
      relations: [
        { relationType: "same-color", sourceId: "103", targetSourceId: "103" },
        { relationType: "same-color", sourceId: "103", targetSourceId: "999" },
        { relationType: "same-color", sourceId: "103", targetSourceId: "999" },
      ],
      media: [{ sourceUrl: "https://ancuong.com/tracker.gif", productSourceId: "103", role: "gallery", mimeType: "text/html", width: 1, height: 1, status: "downloaded", sha256: "bad" }],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "DUPLICATE_PRODUCT",
      "SELF_RELATION",
      "MEDIA_MIME_INVALID",
      "TRACKING_PIXEL",
      "CHECKSUM_INVALID",
      "RELATION_UNRESOLVED",
      "DUPLICATE_RELATION",
    ]));
  });
});
