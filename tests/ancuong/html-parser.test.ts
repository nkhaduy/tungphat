import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifySourceText,
  parseCatalogueCategories,
  parseDimensionThicknessTable,
  parseExplicitRelations,
  parseListingPage,
  parseProductDetail
} from "@/scripts/ancuong/html";

const fixture = (name: string) => readFile(join(process.cwd(), "tests/fixtures/ancuong", name), "utf8");

describe("An Cuong SSR HTML parsers", () => {
  it("discovers only product categories from the root product menu", async () => {
    const categories = parseCatalogueCategories(await fixture("catalogue-root.html"));
    expect(categories).toEqual([
      { name: "Acrylic", slug: "acrylic", sourceUrl: "https://ancuong.com/acrylic.html", catalogueUrls: [] },
      { name: "Chỉ PVC", slug: "chi-dan-canh-pvc", sourceUrl: "https://ancuong.com/chi-dan-canh-pvc.html", catalogueUrls: [] },
      { name: "Laminate", slug: "laminate", sourceUrl: "https://ancuong.com/laminate.html", catalogueUrls: [] },
      { name: "Melamine", slug: "melamine", sourceUrl: "https://ancuong.com/melamine.html", catalogueUrls: ["https://catalogue.ancuong.com/innovative-mfc-mdf-melamine-panels/"] }
    ]);
  });

  it("maps listing option ids back to distinct source facets", async () => {
    const listing = parseListingPage(await fixture("melamine-listing.html"), "https://ancuong.com/melamine.html");
    expect(listing.facets).toEqual({
      "Bề Mặt": ["Pearl"],
      "Kích Thước (mm)": ["1220*2440"],
      "Loại Vân": ["Đơn Sắc"],
      "Màu Sắc": ["Trắng", "Xám"],
      "Nhóm Giá": ["C", "E"]
    });
    expect(listing.products).toHaveLength(2);
    expect(listing.products[0]).toEqual({
      sourceUrl: "https://ancuong.com/melamine/303000078.html",
      sourceId: "303000078",
      category: "Melamine",
      categorySlug: "melamine",
      productCode: "MFC - MS 106 SH",
      name: "Milky White",
      imageUrl: "https://ancuong.com/products/products-thumb/30300007800100090048.jpg",
      facetKeys: {
        "Bề Mặt": ["Pearl"],
        "Kích Thước (mm)": ["1220*2440"],
        "Loại Vân": ["Đơn Sắc"],
        "Màu Sắc": ["Trắng"],
        "Nhóm Giá": ["E"]
      }
    });
  });

  it("uses the stable category URL slug instead of a display-label slug", async () => {
    const listing = parseListingPage(await fixture("melamine-listing.html"), "https://ancuong.com/chi-dan-canh-pvc.html");
    expect(listing.products[0]?.categorySlug).toBe("chi-dan-canh-pvc");
  });

  it("converts source checkmark tables into a dimension-thickness matrix", async () => {
    const matrix = parseDimensionThicknessTable(await fixture("melamine-detail.html"));
    expect(matrix).toEqual([
      { dimension: "1220x2440", thicknesses: ["9", "12", "15", "18", "25"] },
      { dimension: "1830x2440", thicknesses: ["12", "18", "25"] }
    ]);
  });

  it("parses product facts, lazy images, product lines and technical warnings", async () => {
    const detail = parseProductDetail(await fixture("melamine-detail.html"), {
      sourceUrl: "https://ancuong.com/melamine/303000078.html",
      sourceHash: "a".repeat(64),
      discoveredAt: "2026-08-04T00:00:00.000Z",
      fetchedAt: "2026-08-04T00:01:00.000Z"
    });
    expect(detail).toEqual(expect.objectContaining({
      sourceId: "303000078",
      category: "Melamine",
      categorySlug: "melamine",
      name: "Milky White",
      productCode: "MFC - MS 106 SH",
      facets: {
        "Giải Pháp": ["Giải Pháp Chỉ Đồng Màu"],
        "Kích Thước (mm)": ["1220*2440"],
        "Loại Sản Phẩm": ["Melamine"],
        "Loại Vân": ["Đơn Sắc"],
        "Màu Sắc": ["Trắng"],
        "Nhóm Giá": ["E"]
      },
      primaryImageUrl: "https://ancuong.com/products/products-full/30300007800100090048.jpg",
      galleryUrls: [
        "https://ancuong.com/products/products-full/30300007800100090048.jpg",
        "https://acshopping.ancuong.com/Upload/MaterialApp/303000078-0-0-20.jpg"
      ]
    }));
    expect(detail.productLines[0]).toEqual(expect.objectContaining({
      name: "Ván Dăm Phủ Melamine",
      features: ["Dễ thi công", "Độ bền bề mặt cao"],
      standards: ["ENF", "E1"],
      dimensionThicknessMatrix: [
        { dimension: "1220x2440", thicknesses: ["9", "12", "15", "18", "25"] },
        { dimension: "1830x2440", thicknesses: ["12", "18", "25"] }
      ],
      technicalWarnings: ["* Tuỳ theo mã sản phẩm sẽ có kích thước khác nhau."]
    }));
    expect(detail.sourceContent).toContainEqual({
      value: "Ván Dăm phủ Melamine là vật liệu cơ bản phổ biến trong lĩnh vực nội thất và thiết kế không gian.",
      classification: "SOURCE_MARKETING_COPY",
      contentUsageStatus: "requires-rewrite"
    });
  });

  it("creates same-color relations only from the explicit product-map tab", async () => {
    const html = await fixture("melamine-detail.html");
    const relations = parseExplicitRelations(html);
    expect(relations.sameColorProducts).toEqual([
      { relationType: "same-color", sourceUrl: "https://ancuong.com/chi-dan-canh-pvc/303000849.html", sourceId: "303000849", productCode: "PVC 101 SH", name: "Solid color edge" },
      { relationType: "same-color", sourceUrl: "https://ancuong.com/chi-dan-canh-pvc/303000855.html", sourceId: "303000855", productCode: "PVC 106 SH", name: "Glossy edge" }
    ]);
    expect(relations.sameColorProducts).toHaveLength(2);
    expect(relations.relatedProducts).toContainEqual({
      relationType: "same-line",
      sourceUrl: "https://ancuong.com/melamine/van-dam-phu-melamine.html",
      name: "Ván Dăm Phủ Melamine"
    });
    expect(relations.applicationProducts).toEqual([{ relationType: "application", sourceUrl: "https://ancuong.com/album-product/1071", sourceId: "1071", name: "Sản Phẩm Ứng Dụng" }]);
  });

  it("classifies source marketing separately from technical facts", () => {
    expect(classifySourceText("Kích thước 1220 x 2440 mm")).toEqual({
      value: "Kích thước 1220 x 2440 mm",
      classification: "TECHNICAL_DATA",
      contentUsageStatus: "technical-data"
    });
    expect(classifySourceText("Giải pháp hoàn hảo cho mọi không gian sống")).toEqual({
      value: "Giải pháp hoàn hảo cho mọi không gian sống",
      classification: "SOURCE_MARKETING_COPY",
      contentUsageStatus: "requires-rewrite"
    });
  });
});
