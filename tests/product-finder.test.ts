import { describe, expect, it } from "vitest";
import { filterProductCards } from "@/lib/product-finder";
import { coreMaterialCards, surfaceCatalogueCards } from "@/lib/product-taxonomy";

const cards = [...coreMaterialCards, ...surfaceCatalogueCards];

describe("product finder", () => {
  it("finds material names without requiring Vietnamese accents", () => {
    expect(filterProductCards(cards, { query: "chong am", group: "all" }).map((card) => card.id)).toContain("mdf-moisture-resistant");
  });

  it("separates core materials from decorative surfaces", () => {
    expect(filterProductCards(cards, { query: "", group: "surface" }).map((card) => card.id)).toEqual(surfaceCatalogueCards.map((card) => card.id));
    expect(filterProductCards(cards, { query: "", group: "core" }).map((card) => card.id)).toEqual(coreMaterialCards.map((card) => card.id));
  });
});
