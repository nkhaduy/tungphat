import { describe, expect, it } from "vitest";
import { supplierNavigation } from "../lib/catalog/core/navigation";
import { createRouteOwnershipIndex } from "../lib/catalog/core/routes";
import { getSupplierSitemapEntries } from "../lib/catalog/suppliers/sitemap";
import {
  anCuongAdapter,
  baThanhAdapter,
  thanhThuyAdapter,
} from "../lib/catalog/suppliers";

describe("supplier catalogue navigation", () => {
  it("keeps compact catalogue and brand groups for all suppliers", () => {
    expect(
      supplierNavigation.catalogue.map((link) => [link.supplierId, link.href]),
    ).toEqual([
      ["thanh-thuy", "/thuong-hieu/thanh-thuy/"],
      ["ba-thanh", "/ma-mau-melamine/ba-thanh/"],
      ["an-cuong", "/catalogue/an-cuong/"],
    ]);
    expect(
      supplierNavigation.brands.map((link) => [link.supplierId, link.href]),
    ).toEqual([
      ["thanh-thuy", "/thuong-hieu/thanh-thuy/"],
      ["ba-thanh", "/thuong-hieu/ba-thanh/"],
      ["an-cuong", "/san-pham/an-cuong/"],
    ]);
  });

  it("has no duplicate route ownership across supplier adapters", () => {
    const claims = [thanhThuyAdapter, baThanhAdapter, anCuongAdapter].flatMap(
      (adapter) => adapter.getRouteClaims(),
    );

    expect(() => createRouteOwnershipIndex(claims)).not.toThrow();
  });
});

describe("composed supplier sitemap", () => {
  it("contains 8 Thanh Thuy and 12 Ba Thanh canonical URLs without An Cuong noindex routes", () => {
    const entries = getSupplierSitemapEntries("2026-08-05T00:00:00.000Z");
    const bySupplier = (supplierId: string) =>
      entries.filter((entry) => entry.supplierId === supplierId);

    expect(bySupplier("thanh-thuy")).toHaveLength(8);
    expect(bySupplier("ba-thanh")).toHaveLength(12);
    expect(bySupplier("an-cuong")).toHaveLength(0);
    expect(new Set(entries.map((entry) => entry.path)).size).toBe(
      entries.length,
    );
    expect(entries.every((entry) => !/[?#]/.test(entry.path))).toBe(true);
  });
});
