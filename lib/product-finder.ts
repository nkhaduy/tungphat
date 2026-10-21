import { coreMaterialCards, surfaceCatalogueCards, type ProductDiscoveryCard } from "@/lib/product-taxonomy";

export type ProductFilter = { query: string; group: "all" | "core" | "surface" };

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().trim();
}

const coreIds = new Set(coreMaterialCards.map((card) => card.id));
const surfaceIds = new Set(surfaceCatalogueCards.map((card) => card.id));

export function filterProductCards(cards: ProductDiscoveryCard[], filter: ProductFilter): ProductDiscoveryCard[] {
  const query = normalize(filter.query);
  return cards.filter((card) => {
    if (filter.group === "core" && !coreIds.has(card.id)) return false;
    if (filter.group === "surface" && !surfaceIds.has(card.id)) return false;
    return !query || normalize(`${card.title} ${card.description}`).includes(query);
  });
}
