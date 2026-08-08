import { describe, expect, it } from "vitest";
import {
  formatCatalogCardTaxonomy,
  formatCatalogCardTitle,
} from "@/lib/catalog/ui";

describe("catalogue card copy", () => {
  it("keeps a combined Thanh Thuỳ code and name as one title", () => {
    expect(
      formatCatalogCardTitle({
        supplierId: "thanh-thuy",
        code: "301",
        name: "301 Artistic Stripe",
      }),
    ).toBe("301 Artistic Stripe");
  });

  it("removes Ba Thanh material and supplier prefixes", () => {
    expect(
      formatCatalogCardTitle({
        supplierId: "ba-thanh",
        code: "BT111",
        name: "MELAMINE BA THANH – BT 111",
      }),
    ).toBe("BT 111");
    expect(
      formatCatalogCardTitle({
        supplierId: "ba-thanh",
        code: "P2052",
        name: "LAMINATE BA THANH - P2052",
      }),
    ).toBe("P2052");
    expect(
      formatCatalogCardTitle({
        supplierId: "ba-thanh",
        code: "BT 111",
        name: "Melamine Ba Thanh BT 111",
      }),
    ).toBe("BT 111");
  });

  it("prefixes and deduplicates taxonomy labels", () => {
    expect(
      formatCatalogCardTaxonomy({
        category: "melamine",
        series: "Vân Gỗ",
        group: "Vân Gỗ",
        material: "melamine",
      }),
    ).toBe("Danh mục: Melamine · Vân Gỗ");
  });
});
