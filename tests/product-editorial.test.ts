import { expect, it } from "vitest";
import type { ContentEntry } from "@/lib/content";
import { productSchema, type ProductFrontmatter } from "@/lib/content-schema";
import { getMaterialEditorial, mergeProductEditorial, productEditorial } from "@/lib/product-editorial";
import { cmsManagedMaterialSlugs } from "@/lib/product-ownership";
import { parseCatalogUrlState } from "@/lib/catalog/url-state";

// The anonymous CMS exposes published records only. Reuse one valid local-guide
// shape for fixtures; exact CMS values are intentionally enriched by the registry.
function publishedCmsRecords(): ContentEntry<ProductFrontmatter>[] {
  const shape = mergeProductEditorial([])[0];
  return cmsManagedMaterialSlugs.map((slug) => ({ ...shape, slug, canonical: `https://mdftungphat.com/${slug}/`, sourcePath: `payload://products/${slug}`, status: "available" }));
}

it("merges four CMS materials and twelve local guides without inventing specifications", () => {
  const products = mergeProductEditorial(publishedCmsRecords());
  expect(products).toHaveLength(16);
  expect(new Set(products.map((product) => product.slug)).size).toBe(16);
  for (const product of products) {
    const validation = productSchema.safeParse(product);
    if (product.slug === "go-ghep-tram") {
      // This preserved secondary CMS guide has no photo from an allowed source.
      // Keep the schema defect visible; the main taxonomy still requires photos.
      expect(validation.success).toBe(false);
      if (!validation.success) expect(validation.error.issues.map((issue) => issue.path.join("."))).toEqual(["featuredImage", "featuredImageAlt"]);
    } else {
      expect(validation.success).toBe(true);
    }
    expect(product.dimensions).toEqual([]);
    expect(product.thicknesses).toEqual([]);
    expect(product.standards).toEqual([]);
    expect(product.body).toContain("## Cấu tạo và đặc điểm");
    expect(product.body).toContain("## Ứng dụng thường gặp");
    expect(product.body).toContain("## Lưu ý khi lựa chọn");
    expect(product.body).toContain("## Lựa chọn và quy cách cần trao đổi");
    expect(product.canonical).toBe(`https://mdftungphat.com/${product.slug}/`);
  }
});

it("does not republish a CMS-owned material omitted from the anonymous public API", () => {
  const anonymousDocs = publishedCmsRecords().filter((product) => product.slug !== "van-mdf");
  expect(mergeProductEditorial(anonymousDocs).some((product) => product.slug === "van-mdf")).toBe(false);
  expect(mergeProductEditorial([])).toHaveLength(12);
});

it("honors existing CMS visibility and lifecycle without publishing a duplicate", () => {
  const cms = { ...publishedCmsRecords()[0], draft: true, noindex: true, status: "discontinued" as const };
  const merged = mergeProductEditorial([cms]);
  expect(merged.filter((product) => product.slug === cms.slug)).toHaveLength(1);
  expect(merged.find((product) => product.slug === cms.slug)).toMatchObject({ draft: true, noindex: true, status: "discontinued", sourcePath: cms.sourcePath });
});

it("preserves records outside the reviewed material catalogue", () => {
  const unrelated = { ...publishedCmsRecords()[0], slug: "existing-guide", body: "Existing CMS copy" };
  expect(mergeProductEditorial([unrelated]).find((product) => product.slug === "existing-guide")).toBe(unrelated);
});

it("has distinct material guidance and valid related destinations", () => {
  expect(new Set(Object.values(productEditorial).map((entry) => entry.structure)).size).toBe(16);
  for (const [slug, entry] of Object.entries(productEditorial)) {
    expect(entry.references.length).toBeGreaterThan(0);
    for (const related of entry.related) {
      expect(related).not.toBe(slug);
      expect(getMaterialEditorial(related)).toBeDefined();
    }
  }
  expect(productEditorial["van-mfc"].intro).toContain("ván dăm");
  expect(productEditorial["mdf-chong-am"].structure).toContain("chống ẩm không có nghĩa là chịu được ngâm nước");
});

it("uses catalogue group parameters that the destination actually understands", () => {
  for (const material of ["melamine", "laminate", "acrylic"]) {
    const url = new URL(productEditorial[material].catalogue!, "https://mdftungphat.com");
    expect(parseCatalogUrlState(url.searchParams).group).toBe(material);
  }
});

it("uses plain customer-facing language across all material guides", () => {
  for (const entry of Object.values(productEditorial)) {
    expect([entry.intro, entry.structure, ...entry.applications, entry.selection, entry.options].join(" ")).not.toMatch(/(?:^|\s)cốt(?=\s|[,.!?]|$)/iu);
  }
});

it("keeps a later CMS update date for CMS-managed materials", () => {
  const cms = { ...publishedCmsRecords()[0], updatedAt: "2026-12-03" };
  expect(mergeProductEditorial([cms]).find((product) => product.slug === cms.slug)?.updatedAt).toBe("2026-12-03");
});

it("reflects the reviewed November 13 material editorial date when CMS is older", () => {
  const cms = { ...publishedCmsRecords()[0], updatedAt: "2026-11-10" };
  expect(mergeProductEditorial([cms]).find((product) => product.slug === cms.slug)?.updatedAt).toBe("2026-11-13");
});
