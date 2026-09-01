import { describe, expect, it } from "vitest";
import { supplierNavigation } from "../lib/catalog/core/navigation";
import { createRouteOwnershipIndex } from "../lib/catalog/core/routes";
import { getSupplierSitemapEntries } from "../lib/catalog/suppliers/sitemap";
import { getSupplierSearchEntries } from "../lib/catalog/suppliers/search";
import { searchSupplierCatalog } from "../lib/catalog/core/search";
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
      ["thanh-thuy", "/catalogue/thanh-thuy/"],
      ["ba-thanh", "/catalogue/ba-thanh/"],
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

  it("builds a route-safe cross-supplier search index without global imports", () => {
    const entries = getSupplierSearchEntries();
    const claims = [thanhThuyAdapter, baThanhAdapter, anCuongAdapter].flatMap(
      (adapter) => adapter.getRouteClaims(),
    );
    const owners = createRouteOwnershipIndex(claims);

    expect(entries.length).toBeGreaterThan(2_500);
    expect(searchSupplierCatalog(entries, "BT-111")[0]).toMatchObject({
      supplierId: "ba-thanh",
      code: "BT111",
    });
    expect(
      entries.every(
        (entry) => owners.get(entry.canonicalRoute) === entry.supplierId,
      ),
    ).toBe(true);
  });
});

describe("composed supplier sitemap", () => {
  it("contains hubs and indexable color detail routes only", () => {
    const entries = getSupplierSitemapEntries("2026-08-05T00:00:00.000Z");
    const bySupplier = (supplierId: string) =>
      entries.filter((entry) => entry.supplierId === supplierId);

    expect(bySupplier("thanh-thuy").some((entry) => entry.path === "/catalogue/thanh-thuy/")).toBe(true);
    expect(bySupplier("ba-thanh").some((entry) => entry.path === "/catalogue/ba-thanh/")).toBe(true);
    expect(bySupplier("an-cuong").some((entry) => entry.path === "/catalogue/an-cuong/")).toBe(true);
    expect(entries.every((entry) => entry.indexable)).toBe(true);
    expect(entries.filter((entry) => entry.path.split("/").filter(Boolean).length === 4).every((entry) => {
      const searchEntry = getSupplierSearchEntries().find((record) => record.canonicalRoute === entry.path);
      return searchEntry?.indexable === true;
    })).toBe(true);
    expect(new Set(entries.map((entry) => entry.path)).size).toBe(
      entries.length,
    );
    expect(entries.every((entry) => !/[?#]/.test(entry.path))).toBe(true);
  });
});
