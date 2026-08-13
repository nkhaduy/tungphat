import { describe, expect, it } from "vitest";
import {
  createSupplierRegistry,
  supplierDefinitions,
} from "../lib/catalog/core/registry";
import {
  catalogMerchandisingScore,
  getCatalogSearchOptionsForSelection,
  searchSupplierCatalog,
} from "../lib/catalog/core/search";
import {
  createRouteOwnershipIndex,
  getRouteOwner,
} from "../lib/catalog/core/routes";
import { composeSupplierSitemap } from "../lib/catalog/core/sitemap";
import { buildSupplierProductJsonLd } from "../lib/catalog/core/structured-data";
import type {
  CatalogRouteClaim,
  CatalogSearchEntry,
  CatalogSitemapEntry,
  SupplierDefinition,
} from "../lib/catalog/core/types";
import {
  anCuongAdapter,
  baThanhAdapter,
  thanhThuyAdapter,
} from "../lib/catalog/suppliers";
import {
  catalogGroupOptions,
  classifyCatalogGroup,
} from "../lib/catalog/material-taxonomy";

const thanhThuy: SupplierDefinition = {
  id: "thanh-thuy",
  displayName: "Thanh Thuỳ",
  brandName: "Thanh Thuỳ",
  recordKind: "product",
  brandPath: "/thuong-hieu/thanh-thuy/",
  cataloguePath: "/thuong-hieu/thanh-thuy/",
};

const baThanh: SupplierDefinition = {
  id: "ba-thanh",
  displayName: "Ba Thanh",
  brandName: "Ba Thanh",
  recordKind: "color-code",
  brandPath: "/thuong-hieu/ba-thanh/",
  cataloguePath: "/ma-mau-melamine/ba-thanh/",
};

describe("supplier catalogue registry", () => {
  it("registers exactly one definition for each supplier", () => {
    const registry = createSupplierRegistry([thanhThuy, baThanh]);

    expect(registry.all().map((supplier) => supplier.id)).toEqual([
      "thanh-thuy",
      "ba-thanh",
    ]);
    expect(registry.get("ba-thanh")).toEqual(baThanh);
  });

  it("rejects duplicate supplier IDs", () => {
    expect(() => createSupplierRegistry([thanhThuy, thanhThuy])).toThrow(
      /duplicate supplier id/i,
    );
  });

  it("ships the three supplier definitions with isolated brand names", () => {
    expect(
      supplierDefinitions.map((supplier) => [supplier.id, supplier.brandName]),
    ).toEqual([
      ["thanh-thuy", "Thanh Thuỳ"],
      ["ba-thanh", "Ba Thanh"],
      ["an-cuong", "An Cường"],
    ]);
  });
});

describe("supplier catalogue search", () => {
  const entries: CatalogSearchEntry[] = [
    {
      supplierId: "thanh-thuy",
      supplierName: "Thanh Thuỳ",
      kind: "product",
      code: "BT 111 Plus",
      name: "Bề mặt BT 111 Plus",
      thumbnail: "/catalog/thanh-thuy/bt-111-plus.webp",
      canonicalRoute: "/san-pham/melamine/bt-111-plus/",
      category: "Melamine",
      material: "melamine",
      canonicalGroup: "woodgrain",
    },
    {
      supplierId: "ba-thanh",
      supplierName: "Ba Thanh",
      kind: "color-code",
      code: "BT 111",
      name: "Melamine Ba Thanh BT 111",
      thumbnail: "/catalog/ba-thanh/bt-111.webp",
      canonicalRoute: "/ma-mau-melamine/ba-thanh/bt-111/",
      category: "Vân gỗ",
      material: "melamine",
      canonicalGroup: "woodgrain",
    },
    {
      supplierId: "an-cuong",
      supplierName: "An Cường",
      kind: "catalogue-item",
      code: "MFC - MS 01012 T",
      name: "Laricio Pine",
      thumbnail: "/catalog/an-cuong/laricio-pine.webp",
      canonicalRoute: "/catalogue/an-cuong/",
      category: "Melamine",
      series: "Ván Dăm Phủ Melamine",
      material: "melamine",
      canonicalGroup: "woodgrain",
    },
  ];

  it.each(["BT 111", "BT111", "BT-111"])(
    "ranks the exact normalized code first for %s",
    (query) => {
      expect(searchSupplierCatalog(entries, query)[0]?.supplierId).toBe(
        "ba-thanh",
      );
    },
  );

  it("filters by supplier without leaking routes from another supplier", () => {
    const results = searchSupplierCatalog(entries, "melamine", {
      supplierId: "an-cuong",
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      supplierId: "an-cuong",
      canonicalRoute: "/catalogue/an-cuong/",
    });
  });

  it("groups default mixed results by the requested supplier priority", () => {
    const ordered = searchSupplierCatalog(entries, "");

    expect(ordered[0]).toMatchObject({
      supplierId: "thanh-thuy",
      code: "BT 111 Plus",
    });
    expect(ordered[1]?.supplierId).toBe("ba-thanh");
    expect(ordered[2]?.supplierId).toBe("an-cuong");
    expect(catalogMerchandisingScore(ordered[1])).toBeGreaterThan(
      catalogMerchandisingScore(ordered[2]),
    );
  });

  it("uses alphabetical order only as the final tie-breaker", () => {
    const tied: CatalogSearchEntry[] = [
      {
        ...entries[0],
        code: "ZZ 10",
        name: "Cùng mức ưu tiên",
        canonicalRoute: "/zz/",
      },
      {
        ...entries[0],
        code: "AA 10",
        name: "Cùng mức ưu tiên",
        canonicalRoute: "/aa/",
      },
    ];

    expect(searchSupplierCatalog(tied, "").map((entry) => entry.code)).toEqual([
      "AA 10",
      "ZZ 10",
    ]);
  });

  it("filters canonical pattern groups before applying merchandising", () => {
    expect(
      searchSupplierCatalog(entries, "", {
        material: "melamine",
        canonicalGroup: "woodgrain",
      }).map(
        (entry) => entry.code,
      ),
    ).toEqual(["BT 111 Plus", "BT 111", "MFC - MS 01012 T"]);
  });

  it("maps material and canonical pattern selections independently", () => {
    expect(getCatalogSearchOptionsForSelection("melamine", "woodgrain", "all"))
      .toEqual({ canonicalGroup: "woodgrain", group: undefined, material: "melamine" });
  });

  it("puts demand before partial-match strength", () => {
    const partialMatches: CatalogSearchEntry[] = [
      { ...entries[0], id: "high-demand-name", code: "ZZ 900", name: "Oak Pattern", demandScore: 1000 },
      { ...entries[0], id: "low-demand-code", code: "XX OAK 100", name: "Neutral", demandScore: 0 },
    ];
    expect(searchSupplierCatalog(partialMatches, "OAK")[0]?.id).toBe("high-demand-name");
  });
});

describe("canonical catalogue pattern groups", () => {
  it.each([
    ["Vân Gỗ", "woodgrain"],
    ["van-go", "woodgrain"],
    ["Woodgrain", "woodgrain"],
    ["Đơn Sắc", "solid"],
    ["solid colour", "solid"],
    ["Vân Đá & Vật Liệu Công Nghiệp", "stone-material"],
    ["Vân Vải | Da | Mây", "textile-leather-rattan"],
    ["Hiệu Ứng Khác", "effect"],
  ])("normalizes %s to %s", (source, expected) => {
    expect(classifyCatalogGroup([source])).toBe(expected);
  });

  it("leaves supplier collections without a canonical pattern ungrouped", () => {
    expect(classifyCatalogGroup(["Ultra Series", "LP Collection"])).toBeUndefined();
  });

  it("counts only groups available for the selected supplier and material", () => {
    const groupedEntries: CatalogSearchEntry[] = [
      {
        supplierId: "thanh-thuy",
        supplierName: "Thanh Thuỳ",
        kind: "product",
        code: "301",
        name: "301 Artistic Stripe",
        thumbnail: "",
        canonicalRoute: "/catalogue/thanh-thuy/melamine/301/",
        material: "melamine",
        canonicalGroup: "woodgrain",
      },
      {
        supplierId: "thanh-thuy",
        supplierName: "Thanh Thuỳ",
        kind: "product",
        code: "021",
        name: "021 Flamingo Pink",
        thumbnail: "",
        canonicalRoute: "/catalogue/thanh-thuy/melamine/021/",
        material: "melamine",
        canonicalGroup: "solid",
      },
      {
        supplierId: "an-cuong",
        supplierName: "An Cường",
        kind: "color-code",
        code: "PVC 031",
        name: "Woodgrain edge",
        thumbnail: "",
        canonicalRoute: "/catalogue/an-cuong/edge-banding/pvc-031/",
        material: "edge-banding",
        canonicalGroup: "woodgrain",
      },
    ];

    expect(
      catalogGroupOptions(groupedEntries, {
        supplierId: "thanh-thuy",
        material: "melamine",
      }),
    ).toEqual([
      { slug: "all", label: "Tất cả", count: 2 },
      { slug: "woodgrain", label: "Vân gỗ", count: 1 },
      { slug: "solid", label: "Đơn sắc", count: 1 },
    ]);
  });
});

describe("supplier route ownership", () => {
  const claims: CatalogRouteClaim[] = [
    {
      supplierId: "thanh-thuy",
      path: "/thuong-hieu/thanh-thuy/",
      kind: "brand",
      indexable: true,
    },
    {
      supplierId: "thanh-thuy",
      path: "/san-pham/melamine/",
      kind: "category",
      indexable: true,
    },
    {
      supplierId: "ba-thanh",
      path: "/ma-mau-melamine/ba-thanh/bt-111/",
      kind: "detail",
      indexable: true,
    },
    {
      supplierId: "an-cuong",
      path: "/catalogue/an-cuong/",
      kind: "catalogue",
      indexable: false,
    },
  ];

  it("resolves canonical routes to one supplier", () => {
    const index = createRouteOwnershipIndex(claims);

    expect(getRouteOwner(index, "/san-pham/melamine")).toBe("thanh-thuy");
    expect(getRouteOwner(index, "/catalogue/an-cuong/?q=mfc")).toBe("an-cuong");
    expect(getRouteOwner(index, "/thuong-hieu/ba-thanh/")).toBeUndefined();
  });

  it("rejects routes claimed by multiple suppliers", () => {
    expect(() =>
      createRouteOwnershipIndex([
        ...claims,
        {
          supplierId: "ba-thanh",
          path: "/san-pham/melamine/",
          kind: "category",
          indexable: true,
        },
      ]),
    ).toThrow(/route collision/i);
  });
});

describe("supplier sitemap composition", () => {
  const entries: CatalogSitemapEntry[] = [
    {
      supplierId: "thanh-thuy",
      path: "/thuong-hieu/thanh-thuy/",
      indexable: true,
    },
    {
      supplierId: "ba-thanh",
      path: "/ma-mau-melamine/ba-thanh/bt-01/",
      indexable: false,
    },
    {
      supplierId: "an-cuong",
      path: "/catalogue/an-cuong/?q=mfc",
      indexable: true,
    },
  ];

  it("includes canonical indexable paths only", () => {
    expect(composeSupplierSitemap(entries)).toEqual([
      {
        supplierId: "thanh-thuy",
        path: "/thuong-hieu/thanh-thuy/",
        indexable: true,
      },
    ]);
  });

  it("rejects duplicate canonical sitemap paths", () => {
    expect(() =>
      composeSupplierSitemap([
        entries[0],
        { ...entries[0], supplierId: "ba-thanh" },
      ]),
    ).toThrow(/duplicate sitemap path/i);
  });
});

describe("supplier adapters", () => {
  it("preserves supplier-specific record counts and SEO gates", () => {
    expect(thanhThuyAdapter.getSearchEntries()).toHaveLength(348);
    expect(baThanhAdapter.getSearchEntries()).toHaveLength(383);
    expect(anCuongAdapter.getSearchEntries()).toHaveLength(2_331);

    expect(
      thanhThuyAdapter.getSearchEntries().filter((entry) => entry.recordType === "color-code"),
    ).toHaveLength(342);
    expect(
      baThanhAdapter.getSearchEntries().filter((entry) => entry.recordType === "color-code"),
    ).toHaveLength(372);
    expect(
      anCuongAdapter.getSearchEntries().filter((entry) => entry.recordType === "color-code"),
    ).toHaveLength(2_195);

    expect(thanhThuyAdapter.getSitemapEntries().filter((entry) => entry.indexable).length).toBeGreaterThan(0);
    expect(baThanhAdapter.getSitemapEntries().filter((entry) => entry.indexable).length).toBeGreaterThan(0);
    expect(
      anCuongAdapter.getSitemapEntries().filter((entry) => entry.indexable),
    ).toContainEqual(expect.objectContaining({ path: "/catalogue/an-cuong/melamine/" }));
  });

  it("carries Ba Thanh demand priority into the shared catalogue search", () => {
    const ordered = searchSupplierCatalog(
      baThanhAdapter.getSearchEntries(),
      "",
      {
        supplierId: "ba-thanh",
        material: "melamine",
      },
    );

    expect(ordered.some((entry) => entry.code === "BT111")).toBe(true);
  });

  it("builds brand-isolated product JSON-LD without invented commerce fields", () => {
    const thanhThuySchema = buildSupplierProductJsonLd(thanhThuy, {
      name: "Thanh Thuỳ LP 101",
      code: "LP 101",
      canonicalRoute: "/san-pham/laminate/thanh-thuy-lp-101/",
      images: ["/catalog/thanh-thuy/lp-101.webp"],
    });
    const baThanhSchema = buildSupplierProductJsonLd(baThanh, {
      name: "Melamine Ba Thanh BT 111",
      code: "BT 111",
      canonicalRoute: "/ma-mau-melamine/ba-thanh/bt-111/",
      images: ["/catalog/ba-thanh/bt-111.webp"],
    });

    expect(thanhThuySchema.brand.name).toBe("Thanh Thuỳ");
    expect(baThanhSchema.brand.name).toBe("Ba Thanh");
    expect(thanhThuySchema).not.toHaveProperty("offers");
    expect(baThanhSchema).not.toHaveProperty("aggregateRating");
  });
});
