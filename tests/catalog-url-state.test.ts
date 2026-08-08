import { describe, expect, it } from "vitest";
import {
  buildCatalogCollectionSearchParams,
  buildCatalogSearchParams,
  catalogRobotsContent,
  isCatalogFilterStateActive,
  parseCatalogCollectionUrlState,
  parseCatalogUrlState,
} from "@/lib/catalog/url-state";

describe("catalogue URL state", () => {
  it("restores the public query, type, group and supplier contract", () => {
    expect(
      parseCatalogUrlState(
        new URLSearchParams(
          "query=BT111&type=melamine&group=van-go&supplier=ba-thanh",
        ),
      ),
    ).toEqual({
      query: "BT111",
      type: "melamine",
      group: "van-go",
      supplierId: "ba-thanh",
    });
  });

  it("accepts legacy q/category links but serializes only the new contract", () => {
    const legacy = parseCatalogUrlState(
      new URLSearchParams("q=SC020M&category=don-sac"),
    );
    const next = buildCatalogSearchParams(
      new URLSearchParams("q=old&category=old&utm_source=preview"),
      legacy,
    );

    expect(legacy).toEqual({
      query: "SC020M",
      type: "all",
      group: "don-sac",
      supplierId: "",
    });
    expect(next.toString()).toBe(
      "utm_source=preview&query=SC020M&group=don-sac",
    );
  });

  it("marks only meaningful search/filter states as noindex candidates", () => {
    expect(
      isCatalogFilterStateActive({
        query: "",
        type: "all",
        group: "",
        supplierId: "",
      }),
    ).toBe(false);
    expect(
      isCatalogFilterStateActive({
        query: "BT111",
        type: "all",
        group: "",
        supplierId: "",
      }),
    ).toBe(true);
    expect(
      isCatalogFilterStateActive({
        query: "",
        type: "supplier",
        group: "",
        supplierId: "",
      }),
    ).toBe(true);
  });

  it("restores supplier collection query/group state and removes legacy keys", () => {
    const state = parseCatalogCollectionUrlState(
      new URLSearchParams("q=LE004G&category=laminate"),
      ["melamine", "laminate", "acrylic"],
    );
    const parameters = buildCatalogCollectionSearchParams(
      new URLSearchParams("q=old&category=old&utm_source=preview"),
      state,
    );

    expect(state).toEqual({ query: "LE004G", group: "laminate" });
    expect(parameters.toString()).toBe(
      "utm_source=preview&query=LE004G&group=laminate",
    );
  });

  it("returns noindex only for active catalogue search/filter states", () => {
    expect(catalogRobotsContent(false)).toBeNull();
    expect(catalogRobotsContent(true)).toBe("noindex, follow");
  });
});
