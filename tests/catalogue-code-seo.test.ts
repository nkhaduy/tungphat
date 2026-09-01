import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CatalogueCodeRoute, { generateMetadata } from "@/app/catalogue/[supplier]/[material]/[code]/page";
import type { PublicSupplierColorCode } from "@/lib/catalog/color-codes/types";
import {
  buildCatalogueCodeSeo,
  catalogueCodeProductSchema,
  findRelatedCatalogueCodes,
} from "@/lib/catalog/code-seo";
import { getSupplierSitemapEntries } from "@/lib/catalog/suppliers/sitemap";

const baseRecord: PublicSupplierColorCode = {
  id: "thanh-thuy:301",
  supplier: "thanh-thuy",
  recordType: "color-code",
  codeRaw: "301",
  codeNormalized: "301",
  searchAliases: ["301"],
  displayName: "301 Artistic Stripe",
  materialType: "melamine",
  patternType: "Vân Gỗ",
  colorFamily: "Artistic Stripe",
  collection: "Vân Gỗ",
  sourceUrl: "https://www.gothanhthuy.com/product/melamine/melamine-van-go/301-artistic-stripe/",
  sourceUrls: ["https://www.gothanhthuy.com/product/melamine/melamine-van-go/301-artistic-stripe/"],
  images: [{
    role: "swatch",
    sourceUrl: "https://www.gothanhthuy.com/assets/301.webp",
    localPath: "/catalog/thanh-thuy/301.webp",
    width: 1600,
    height: 800,
    rightsStatus: "UNCONFIRMED",
  }],
  searchable: true,
  colorCodeEvidence: "decorative-product-detail",
  confidence: "verified",
  seoStatus: "NEEDS_ENRICHMENT",
  slug: "301",
  canonicalRoute: "/catalogue/thanh-thuy/melamine/301/",
  demandScore: 112,
};

describe("catalogue code SEO policy", () => {
  it("indexes a Tier A record with exact searchable identity", () => {
    const seo = buildCatalogueCodeSeo(baseRecord, {
      supplierName: "Thanh Thuỳ",
    });

    expect(seo).toMatchObject({
      tier: "A",
      indexable: true,
      title: "301 Artistic Stripe - Melamine Thanh Thuỳ",
      h1: "301 Artistic Stripe - Melamine Thanh Thuỳ",
      imageAlt: "Mã 301 Artistic Stripe - Melamine Thanh Thuỳ",
    });
    expect(seo.description).toContain("301 Artistic Stripe");
    expect(seo.description).toContain("Melamine Thanh Thuỳ");
    expect(seo.ctaLabel).toBe("Gửi mã 301 qua Zalo");
  });

  it("indexes every Tier A identity without a route allowlist", () => {
    const seo = buildCatalogueCodeSeo({
      ...baseRecord,
      codeRaw: "AC-701",
      codeNormalized: "AC701",
      displayName: "AC-701 Natural Oak",
      slug: "ac-701",
      canonicalRoute: "/catalogue/an-cuong/laminate/ac-701/",
      supplier: "an-cuong",
      materialType: "laminate",
      seoStatus: "NEEDS_ENRICHMENT",
    }, { supplierName: "An Cường" });

    expect(seo).toMatchObject({ tier: "A", indexable: true, robots: { index: true, follow: true } });
  });

  it("keeps a Tier B record noindex when its identity is not descriptive enough", () => {
    const seo = buildCatalogueCodeSeo({
      ...baseRecord,
      codeRaw: "NW 01",
      codeNormalized: "NW01",
      displayName: "NW 01",
      slug: "nw-01",
      canonicalRoute: "/catalogue/thanh-thuy/pvc/nw-01/",
      materialType: "pvc",
    }, {
      supplierName: "Thanh Thuỳ",
    });

    expect(seo).toMatchObject({ tier: "B", indexable: false, robots: { index: false, follow: true } });
  });

  it("keeps a record without a CDN image noindex even when its source name exists", () => {
    const seo = buildCatalogueCodeSeo({
      ...baseRecord,
      codeRaw: "SC028MW",
      codeNormalized: "SC028MW",
      displayName: "Melamine Ba Thanh SC 028MW",
      canonicalRoute: "/catalogue/ba-thanh/melamine/sc028mw/",
      images: [],
    }, {
      supplierName: "Ba Thanh",
    });

    expect(seo).toMatchObject({ tier: "C", indexable: false, robots: { index: false, follow: true } });
  });

  it("does not duplicate a supplier name that is already part of the verified title", () => {
    const seo = buildCatalogueCodeSeo({
      ...baseRecord,
      displayName: "301 Artistic Stripe Thanh Thuỳ",
    }, {
      supplierName: "Thanh Thuỳ",
    });

    expect(seo.title).toBe("301 Artistic Stripe Thanh Thuỳ - Melamine");
  });

  it("emits fact-safe Product data with the code identity and no commerce claims", () => {
    const seo = buildCatalogueCodeSeo(baseRecord, {
      supplierName: "Thanh Thuỳ",
    });
    const schema = catalogueCodeProductSchema(baseRecord, seo, "Thanh Thuỳ");

    expect(schema).toMatchObject({
      "@type": "Product",
      name: "301 Artistic Stripe - Melamine Thanh Thuỳ",
      sku: "301",
      brand: { "@type": "Brand", name: "Thanh Thuỳ" },
      category: "Melamine",
      url: "https://mdftungphat.com/catalogue/thanh-thuy/melamine/301/",
      image: ["https://cdn.mdftungphat.com/catalog/thanh-thuy/301.webp"],
    });
    expect(schema).not.toHaveProperty("offers");
    expect(JSON.stringify(schema)).not.toMatch(/price|availability|aggregateRating/i);
  });

  it("links only a verified sibling with the same named color family", () => {
    const related = findRelatedCatalogueCodes(baseRecord, [
      baseRecord,
      { ...baseRecord, id: "thanh-thuy:302", codeRaw: "302", codeNormalized: "302", displayName: "302 Artistic Stripe", slug: "302", canonicalRoute: "/catalogue/thanh-thuy/melamine/302/" },
      { ...baseRecord, id: "thanh-thuy:303", codeRaw: "303", codeNormalized: "303", displayName: "303 Oak", colorFamily: "Oak", slug: "303", canonicalRoute: "/catalogue/thanh-thuy/melamine/303/" },
    ]);

    expect(related.map((record) => record.codeRaw)).toEqual(["302"]);
  });

  it("renders the primary 301 record as a complete server-side landing page", async () => {
    const params = Promise.resolve({ supplier: "thanh-thuy", material: "melamine", code: "301" });
    const [metadata, page] = await Promise.all([
      generateMetadata({ params }),
      CatalogueCodeRoute({ params }),
    ]);
    const markup = renderToStaticMarkup(page);

    expect(metadata.title).toMatchObject({ absolute: "301 Artistic Stripe - Melamine Thanh Thuỳ | Tùng Phát" });
    expect(metadata.description).toContain("301 Artistic Stripe");
    expect(metadata.alternates?.canonical).toBe("https://mdftungphat.com/catalogue/thanh-thuy/melamine/301/");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(markup).toContain("<h1");
    expect(markup).toContain("301 Artistic Stripe - Melamine Thanh Thuỳ</h1>");
    expect(markup).toContain('alt="Mã 301 Artistic Stripe - Melamine Thanh Thuỳ"');
    expect(markup).toContain("Gửi mã 301 qua Zalo");
    expect(markup).toContain("Nguồn catalogue");
    expect(markup).toContain('href="https://www.gothanhthuy.com/product/melamine/melamine-van-go/301-artistic-stripe/"');
    expect(markup).toContain("Thanh Thuỳ · Melamine");
    expect(markup).toContain("Mã cùng tên Artistic Stripe");
    expect(markup).toContain('href="/catalogue/thanh-thuy/melamine/302"');
    expect(markup).toContain('href="/catalogue/thanh-thuy/melamine"');
  });

  it("includes Tier A in the sitemap and excludes a Tier C code", () => {
    const paths = getSupplierSitemapEntries("2026-09-01T00:00:00.000Z").map((entry) => entry.path);

    expect(paths).toContain("/catalogue/thanh-thuy/melamine/301/");
    expect(paths).not.toContain("/catalogue/ba-thanh/melamine/sc028mw/");
  });
});
