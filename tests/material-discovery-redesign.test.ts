import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { coreMaterialCards, surfaceCatalogueCards } from "@/lib/product-taxonomy";

describe("material discovery redesign", () => {
  const hero = readFileSync("components/home/HomeHero.tsx", "utf8");
  const home = readFileSync("components/home/HomeContent.tsx", "utf8");
  const thanhThuyBrand = readFileSync("components/thanh-thuy/ThanhThuyBrand.tsx", "utf8");
  const baThanhBrand = readFileSync("app/thuong-hieu/ba-thanh/page.tsx", "utf8");

  it("restores the supplied board hero while preserving working discovery and quote actions", () => {
    expect(hero).toContain("bg-white");
    expect(hero).toContain("material-panels-hero.webp");
    expect(hero).toContain('href="#ma-mau"');
    expect(hero).toContain("ZALO_URL");
    expect(hero).toContain('fetchPriority="high"');
  });

  it("keeps supplier catalogues available through color-code discovery", () => {
    expect(home).toContain("getPublicColorCodes");
    expect(home).toContain('featuredCodes("thanh-thuy", 8)');
    expect(home).toContain('featuredCodes("ba-thanh", 8)');
    expect(home).toContain("FAQ");
  });

  it("links discovery to useful material routes", () => {
    const cards = [...coreMaterialCards, ...surfaceCatalogueCards];
    expect(cards.length).toBeGreaterThanOrEqual(10);
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
    expect(cards.every((card) => card.href.startsWith("/") && card.image && card.alt)).toBe(true);
    expect(surfaceCatalogueCards.filter((card) => ["melamine", "laminate", "acrylic"].includes(card.id)).every((card) => card.href.includes("thanh-thuy"))).toBe(true);
  });

  it("explains the different counts used by brand pages and color-code catalogues", () => {
    expect(thanhThuyBrand).toContain("getSupplierTotals");
    expect(baThanhBrand).toContain("getSupplierTotals");
  });

  it("keeps Ba Thanh supplier ranges discoverable without implying stock", () => {
    for (const name of ["HDF", "Plywood Melamine", "Laminate Way", "Ván nhựa PVC", "Ván sàn Dongwha", "Keo dán cạnh"]) expect(baThanhBrand).toContain(name);
    expect(baThanhBrand).toContain("Danh mục nguồn Ba Thanh");
  });
});
