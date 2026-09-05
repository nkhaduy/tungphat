import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { coreMaterialCards, surfaceCatalogueCards } from "@/lib/product-taxonomy";

describe("public product taxonomy", () => {
  it("keeps core and surface groups separate with unique card identities", () => {
    expect(new Set(coreMaterialCards.map((card) => card.id)).size).toBe(coreMaterialCards.length);
    expect(new Set(surfaceCatalogueCards.map((card) => card.id)).size).toBe(surfaceCatalogueCards.length);
    expect(coreMaterialCards.map((card) => card.title)).toEqual([
      "Ván MDF",
      "MDF chống ẩm",
      "MFC",
      "Plywood",
      "Gỗ ghép",
    ]);
    expect(surfaceCatalogueCards.map((card) => card.title)).toEqual([
      "Melamine",
      "Laminate",
      "Acrylic",
      "Veneer",
    ]);
  });

  it("only points cards to existing public destinations and local approved assets", () => {
    for (const card of [...coreMaterialCards, ...surfaceCatalogueCards]) {
      expect(card.href).toMatch(/^\//);
      expect(card.image).toMatch(/^\//);
      expect(existsSync(`public${card.image}`)).toBe(true);
      expect(card.alt.length).toBeGreaterThan(20);
      expect(card.description.length).toBeGreaterThan(20);
    }

    expect(coreMaterialCards.find((card) => card.id === "joined-wood")?.children).toEqual([
      ["Gỗ ghép cao su", "/go-ghep-cao-su/"],
      ["Gỗ ghép tràm", "/go-ghep-tram/"],
    ]);
    expect(surfaceCatalogueCards.every((card) => card.href.startsWith("/catalogue/an-cuong/"))).toBe(true);
  });
});
