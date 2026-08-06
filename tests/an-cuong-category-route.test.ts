import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AnCuongCategoryRoute, {
  generateMetadata,
  generateStaticParams,
} from "@/app/catalogue/an-cuong/[category]/page";
import { anCuongAdapter } from "@/lib/catalog/suppliers/an-cuong";

describe("An Cuong representative category routes", () => {
  it("publishes useful non-empty material categories with self canonical metadata", async () => {
    const parameters = generateStaticParams();
    expect(parameters).toEqual([
      { category: "melamine" },
      { category: "laminate" },
      { category: "acrylic" },
    ]);

    const metadata = await generateMetadata({ params: Promise.resolve({ category: "melamine" }) });
    expect(metadata.alternates?.canonical).toBe("https://mdftungphat.com/catalogue/an-cuong/melamine/");
    expect(metadata.robots).not.toEqual({ index: false, follow: true });

    const nonCuratedMetadata = await generateMetadata({ params: Promise.resolve({ category: "veneer" }) });
    expect(nonCuratedMetadata.robots).toMatchObject({ index: false });
  });

  it("claims only routes that can render an owned page", () => {
    expect(anCuongAdapter.getRouteClaims().map((claim) => claim.path)).toEqual([
      "/catalogue/an-cuong/",
      "/catalogue/an-cuong/melamine/",
      "/catalogue/an-cuong/laminate/",
      "/catalogue/an-cuong/acrylic/",
    ]);
  });

  it("renders distinct useful category copy with breadcrumb and ItemList JSON-LD", async () => {
    const htmlByCategory = new Map<string, string>();
    for (const category of ["melamine", "laminate", "acrylic"]) {
      const page = await AnCuongCategoryRoute({ params: Promise.resolve({ category }) });
      htmlByCategory.set(category, renderToStaticMarkup(createElement(() => page)));
    }

    expect(htmlByCategory.get("melamine")).toContain("Ứng dụng phù hợp");
    expect(htmlByCategory.get("melamine")).toContain("BreadcrumbList");
    expect(htmlByCategory.get("melamine")).toContain("ItemList");
    expect(htmlByCategory.get("melamine")).toContain("Nhắn Zalo kiểm tra Melamine");
    expect(htmlByCategory.get("melamine")).not.toContain("/catalogue/an-cuong/sku/");
    expect(new Set(htmlByCategory.values()).size).toBe(3);
  });
});
