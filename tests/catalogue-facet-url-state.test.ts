import { describe, expect, it } from "vitest";
import { buildCatalogueUrlParams, hasCatalogueUrlFilters, hasCatalogueUrlStateParams, parseCatalogueUrlState } from "@/lib/catalog/facet-url-state";

const allowed = {
  supplier: ["an-cuong", "ba-thanh", "thanh-thuy"].map((value) => ({ value, count: 1 })),
  material: ["melamine", "laminate", "pvc", "ppet"].map((value) => ({ value, count: 1 })),
  pattern: ["woodgrain", "solid", "stone-material", "textile-leather-rattan", "effect"].map((value) => ({ value, count: 1 })),
  surfaceEffect: [{ value: "Bóng Mờ", count: 1 }],
};

describe("catalogue multi-facet URL state", () => {
  it("round-trips repeated facet values and preserves unrelated query parameters", () => {
    const parsed = parseCatalogueUrlState(new URLSearchParams("utm_source=mail&query=  go%20do%20&supplier=an-cuong&material=melamine&material=laminate&pattern=woodgrain&surface=B%C3%B3ng%20M%E1%BB%9D"), allowed);
    const result = buildCatalogueUrlParams(new URLSearchParams("utm_source=mail&group=legacy"), parsed);

    expect(result.getAll("material")).toEqual(["laminate", "melamine"]);
    expect(result.getAll("pattern")).toEqual(["woodgrain"]);
    expect(result.getAll("surface")).toEqual(["Bóng Mờ"]);
    expect(result.get("query")).toBe("go do");
    expect(result.get("utm_source")).toBe("mail");
    expect(result.get("group")).toBeNull();
    expect(hasCatalogueUrlFilters(parsed)).toBe(true);
  });

  it("ignores unsupported supplier and pattern identifiers", () => {
    const state = parseCatalogueUrlState(new URLSearchParams("supplier=unknown&pattern=core-board&material=mdf&surface=imaginary"), allowed);
    expect(state.supplier).toEqual([]);
    expect(state.pattern).toEqual([]);
    expect(state.material).toEqual([]);
    expect(state.surfaceEffect).toEqual([]);
  });

  it("maps legacy material and pattern query parameters to verified facet values", () => {
    const laminate = parseCatalogueUrlState(new URLSearchParams("type=melamine&group=laminate"), allowed);
    expect(laminate.material).toEqual(["laminate"]);
    expect(laminate.pattern).toEqual([]);

    const melamineWood = parseCatalogueUrlState(new URLSearchParams("type=melamine&group=van-go"), allowed);
    expect(melamineWood.material).toEqual(["melamine"]);
    expect(melamineWood.pattern).toEqual(["woodgrain"]);

    const legacyPvc = parseCatalogueUrlState(new URLSearchParams("category=pvc-ppet"), allowed);
    expect(legacyPvc.material).toEqual(["pvc", "ppet"]);
  });

  it("recognizes unsupported facet query keys so they can be kept out of the index", () => {
    expect(hasCatalogueUrlStateParams(new URLSearchParams("material=not-in-catalogue"))).toBe(true);
    expect(hasCatalogueUrlStateParams(new URLSearchParams("search=oak"))).toBe(false);
    expect(hasCatalogueUrlStateParams(new URLSearchParams("utm_source=mail"))).toBe(false);
  });

  it("round-trips supported sort modes and ignores unsupported modes", () => {
    const codeSort = parseCatalogueUrlState(new URLSearchParams("sort=code"), allowed);
    expect(codeSort.sort).toBe("code");
    expect(buildCatalogueUrlParams(new URLSearchParams(), codeSort).get("sort")).toBe("code");
    expect(parseCatalogueUrlState(new URLSearchParams("sort=newest"), allowed).sort).toBe("relevance");
  });
});
