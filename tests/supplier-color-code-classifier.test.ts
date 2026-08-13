import { describe, expect, it } from "vitest";
import { classifyAnCuongRecord } from "@/lib/catalog/color-codes/an-cuong";
import { classifyBaThanhRecord } from "@/lib/catalog/color-codes/ba-thanh";
import { classifyThanhThuyRecord } from "@/lib/catalog/color-codes/thanh-thuy";

describe("supplier color-code classifiers", () => {
  it("keeps the complete An Cuong code and maps fullsheet/application media", () => {
    const result = classifyAnCuongRecord({
      sourceId: "303003318",
      sourceUrl: "https://ancuong.com/melamine/303003318.html",
      productCode: "MFC - MS 465 SC04",
      name: "Santana Oak",
      category: "Melamine",
      productType: "Melamine",
      materialPattern: "Vân Gỗ",
      colors: ["Be"],
      surfaceEffects: ["Synchronized"],
      primaryImage: {
        sourceUrl:
          "https://ancuong.com/products/products-full/30300331800101572065.jpg",
      },
      gallery: [
        {
          sourceUrl:
            "https://acshopping.ancuong.com/Upload/MaterialApp/303003318-showroom-1.jpg",
        },
      ],
    });

    expect(result.purpose).toBe("color-code");
    expect(result.colorCode).toMatchObject({
      supplier: "an-cuong",
      codeRaw: "MFC - MS 465 SC04",
      codeNormalized: "MFCMS465SC04",
      materialType: "melamine",
      patternType: "Vân Gỗ",
      colorFamily: "Be",
      surfaceEffect: "Synchronized",
      colorCodeEvidence: "decorative-product-detail",
      confidence: "verified",
    });
    expect(result.colorCode?.searchAliases).toContain("MS465SC04");
    expect(result.colorCode?.images.map((image) => image.role)).toEqual([
      "fullsheet",
      "application",
    ]);
  });

  it("retains An Cuong relation-only matching codes without inventing media", () => {
    const result = classifyAnCuongRecord({
      recordType: "sku",
      code: "PVC DECAL F025",
      normalizedCode: "PVC DECAL F025",
      name: "Latte",
      category: "PVC Decal",
      productFamily: "PVC Decal",
      canonicalSourceUrl: "https://ancuong.com/ppet-pvc/303014002.html",
      sourceUrls: ["https://ancuong.com/tam-2d-wpb/303011522.html"],
      attributes: { sourceEvidence: "same-color-relation" },
      images: [],
      seoStatus: "NOINDEX_USEFUL",
    });

    expect(result.purpose).toBe("color-code");
    expect(result.colorCode).toMatchObject({
      codeRaw: "PVC DECAL F025",
      materialType: "pvc",
      colorCodeEvidence: "matching-color",
      images: [],
    });
  });

  it("rejects code-like An Cuong rows without decorative evidence", () => {
    const result = classifyAnCuongRecord({
      sourceUrl: "https://ancuong.com/core-board/board-01.html",
      productCode: "BOARD 01",
      name: "MDF chống ẩm",
      category: "Core Boards",
      productType: "MDF",
      primaryImage: {
        sourceUrl: "https://ancuong.com/pictures/mdf-board.jpg",
      },
    });

    expect(result.purpose).toBe("technical");
    expect(result.colorCode).toBeUndefined();
  });

  it.each([
    ["2D EV4300", "Tấm 2D MDF", "2D MDF Chống ẩm phủ Eco-Veneer", "panel"],
    ["NẸP NHÔM U INOX PLUS LL 2500", "Nẹp Nhôm U", "Nẹp Nhôm U Inox Plus", "edge-banding"],
    ["3DWP WP01 P524", "Tấm Ốp Vách 3D", "Ốp Vách 3D", "panel"],
  ] as const)(
    "keeps decorative An Cuong surface code %s even when the substrate or profile name is generic",
    (code, category, productType, materialType) => {
      const result = classifyAnCuongRecord({
        sourceUrl: `https://ancuong.com/product/${encodeURIComponent(code)}.html`,
        productCode: code,
        name: code,
        category,
        productType,
        materialPattern: "Vân Gỗ",
        primaryImage: {
          sourceUrl: `https://ancuong.com/products/products-full/${encodeURIComponent(code)}.jpg`,
        },
      });

      expect(result.colorCode).toMatchObject({ codeRaw: code, materialType });
    },
  );

  it("classifies Ba Thanh Melamine and Laminate SKUs from official maps only", () => {
    const melamine = classifyBaThanhRecord({
      recordType: "sku",
      code: "BT99",
      name: "Melamine Ba Thanh BT 99",
      category: "Melamine",
      productFamily: "Melamine",
      canonicalSourceUrl: "https://bathanh.com.vn/bt-99",
      sourceUrls: ["https://bathanh.com.vn/map-ma-melamine"],
      attributes: { sourceGroup: "van-go", patternGroup: "MÀU VÂN GỖ" },
      collections: ["MÀU VÂN GỖ"],
      images: [
        {
          sourceUrl: "https://bathanh.com.vn/wp-content/uploads/BT99.jpg",
          localPath: "/catalog/ba-thanh/ba-thanh-melamine-bt-99-swatch.webp",
          mediaType: "swatch",
          rightsStatus: "UNCONFIRMED",
        },
      ],
      seoStatus: "NOINDEX_USEFUL",
    });
    const laminate = classifyBaThanhRecord({
      recordType: "sku",
      code: "WAY 105",
      name: "WAY Laminate 105",
      category: "Laminate",
      productFamily: "WAY Laminate",
      canonicalSourceUrl: "https://bathanh.com.vn/way-105",
      sourceUrls: ["https://bathanh.com.vn/map-mau-laminate"],
      attributes: { patternGroup: "Vân đá" },
      collections: ["Laminate Color Map"],
      images: [],
      seoStatus: "NEEDS_ENRICHMENT",
    });

    expect(melamine.colorCode).toMatchObject({
      codeRaw: "BT99",
      materialType: "melamine",
      colorCodeEvidence: "official-color-map",
    });
    expect(laminate.colorCode).toMatchObject({
      codeRaw: "WAY 105",
      materialType: "laminate",
      colorCodeEvidence: "official-color-map",
    });
  });

  it("keeps the official WAY Laminate code instead of replacing it with the matching Melamine code", () => {
    const laminate = classifyBaThanhRecord({
      recordType: "sku",
      code: "P2052",
      name: "Laminate WAY P 2052 G",
      category: "Laminate",
      productFamily: "WAY Laminate",
      canonicalSourceUrl: "https://bathanh.com.vn/way-p2052",
      sourceUrls: ["https://bathanh.com.vn/way-p2052"],
      attributes: {
        patternGroup: "MÀU ĐƠN SẮC",
        finishCode: "G",
        matchingMelamineCode: "SC 017 MW",
      },
      collections: ["Laminate WAY 2025-2026"],
      images: [],
      seoStatus: "NOINDEX_USEFUL",
    });

    expect(laminate.colorCode).toMatchObject({
      codeRaw: "P 2052 G",
      codeNormalized: "P2052G",
      displayName: "Laminate WAY P 2052 G",
      materialType: "laminate",
    });
    expect(laminate.colorCode?.searchAliases).toEqual(
      expect.arrayContaining(["P2052", "P2052 G", "SC 017 MW", "SC017MW"]),
    );
  });

  it("keeps Thanh Thuy coded decorative products and removes families/documents", () => {
    const sku = classifyThanhThuyRecord({
      recordType: "sku",
      code: "SC 016M",
      name: "SC 016M – Oak",
      category: "Melamine",
      productFamily: "Oak",
      canonicalSourceUrl: "https://www.gothanhthuy.com/product/sc-016m/",
      sourceUrls: ["https://www.gothanhthuy.com/color-map/"],
      attributes: { color: "Oak", pattern: "Vân Gỗ" },
      collections: ["Oak"],
      images: [
        {
          sourceUrl: "https://www.gothanhthuy.com/assets/sc-016m.webp",
          localPath: "/catalog/thanh-thuy/sc-016m.webp",
          mediaType: "swatch",
          rightsStatus: "UNCONFIRMED",
        },
      ],
      seoStatus: "NEEDS_ENRICHMENT",
    });
    const family = classifyThanhThuyRecord({
      recordType: "family",
      name: "Tấm Veneer",
      category: "Tấm Veneer",
      images: [],
      sourceUrls: ["https://www.gothanhthuy.com/veneer/"],
    });
    const document = classifyThanhThuyRecord({
      recordType: "document",
      name: "Color Map",
      category: "Color Map",
      images: [],
      sourceUrls: ["https://www.gothanhthuy.com/color-map/"],
    });

    expect(sku.colorCode).toMatchObject({
      codeRaw: "SC 016M",
      materialType: "melamine",
      confidence: "verified",
    });
    expect(family).toMatchObject({ purpose: "product-family" });
    expect(document).toMatchObject({ purpose: "document" });
  });

  it.each([
    ["VENEER CHEERY", "veneer-cheery", "veneer_cherry.webp"],
    ["VENEER OAK", "veneer-oak", "veneer_oak.webp"],
    ["VENEER WALNUT", "veneer-walnut", "veneer_walnut.webp"],
  ])(
    "keeps official Thanh Thuy Veneer surface identifier %s from the public collection",
    (name, slug, imageFile) => {
      const result = classifyThanhThuyRecord({
        recordType: "family",
        name,
        slug: `thanh-thuy-${slug}`,
        category: "Tấm Veneer",
        sourceUrls: [`https://www.gothanhthuy.com/product/veneer/${slug}/`],
        images: [
          {
            sourceUrl: `https://www.gothanhthuy.com/assets/2025/11/${imageFile}`,
            localPath: `/catalog/thanh-thuy/${slug}-500w-test.webp`,
            mediaType: "swatch",
            rightsStatus: "UNCONFIRMED",
          },
        ],
        seoStatus: "NOINDEX_USEFUL",
      });

      expect(result).toMatchObject({
        purpose: "color-code",
        reason: "verified-official-surface-collection",
        colorCode: {
          supplier: "thanh-thuy",
          codeRaw: name,
          materialType: "veneer",
          sourceColorMapUrl: "https://www.gothanhthuy.com/products/veneer/",
          colorCodeEvidence: "official-color-map",
          confidence: "verified",
        },
      });
      expect(result.colorCode?.images).toEqual([
        expect.objectContaining({ role: "swatch", localPath: `/catalog/thanh-thuy/${slug}-500w-test.webp` }),
      ]);
    },
  );
});
