import { describe, expect, it } from "vitest";
import { validateCatalogue } from "../../scripts/ancuong/validate";

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

  it("reports a source-declared product target outside discovery as a warning", () => {
    const result = validateCatalogue({
      products: [validProduct],
      knownProductIds: ["103"],
      relations: [{
        relationType: "same-color",
        sourceId: "103",
        sourceUrl: validProduct.sourceUrl,
        targetSourceId: "303002267",
        targetSourceUrl: "https://ancuong.com/eco-veneer/303002267.html",
      }],
    });

    expect(result.valid).toBe(true);
    expect(result.summary).toEqual(expect.objectContaining({ errors: 0, warnings: 1 }));
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "RELATION_UNRESOLVED",
      level: "warning",
    }));
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
