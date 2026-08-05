import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { cataloguePath, catalogueStaticParams } from "@/lib/brands";
import {
  buildThanhThuyZaloUrl,
  thanhThuyZaloUrl,
} from "@/lib/thanh-thuy-seo";
import { normalizeThanhThuySearchText } from "@/lib/thanh-thuy-search";
import { assertCompleteSourceSnapshot } from "@/scripts/thanh-thuy/import";
import type { SourceProduct, ThanhThuyCatalog } from "@/scripts/thanh-thuy/types";

describe("Thanh Thuy staging QA regressions", () => {
  it("normalizes Vietnamese accents, case, punctuation and surrounding whitespace for search", () => {
    expect(normalizeThanhThuySearchText("  Chỉ nẹp – VÂN GỖ 01  ")).toBe(
      "chi nep van go 01",
    );
    expect(normalizeThanhThuySearchText("THANH THUY")).toBe("thanh thuy");
  });

  it("builds catalogue Zalo messages from the configured base URL", () => {
    expect(
      buildThanhThuyZaloUrl("https://zalo.me/configured-number", "LP 101/104G"),
    ).toBe(
      "https://zalo.me/configured-number?text=T%C3%B4i%20c%E1%BA%A7n%20ki%E1%BB%83m%20tra%20s%E1%BA%A3n%20ph%E1%BA%A9m%20Thanh%20Thu%E1%BB%B3%20m%C3%A3%20LP%20101%2F104G%20t%E1%BA%A1i%20T%C3%B9ng%20Ph%C3%A1t.",
    );
    expect(thanhThuyZaloUrl("142")).toContain("m%C3%A3%20142");
  });

  it("rejects a partial source snapshot instead of deleting existing catalogue records", () => {
    const existing = {
      schemaVersion: 1,
      supplier: "Thanh Thuỳ",
      sourceName: "Gỗ Thanh Thuỳ",
      importedAt: "2026-08-04T00:00:00.000Z",
      checksum: "existing",
      categories: [],
      products: [
        { id: "thanh-thuy:1", sourceId: 1 },
        { id: "thanh-thuy:2", sourceId: 2 },
      ],
    } as ThanhThuyCatalog;
    const partial = [{ id: 1 }] as SourceProduct[];

    expect(() => assertCompleteSourceSnapshot(existing, partial)).toThrow(
      /thiếu 1 sản phẩm.*sourceId 2/i,
    );
  });

  it("routes Thanh Thuy partner entry points to the canonical brand page only", () => {
    expect(cataloguePath("thanh-thuy")).toBe("/thuong-hieu/thanh-thuy/");
    expect(cataloguePath("an-cuong")).toBe("/catalogue/an-cuong/");
    expect(catalogueStaticParams()).not.toContainEqual({ brand: "thanh-thuy" });

    const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      redirects: Array<{ source: string; destination: string }>;
    };
    expect(vercel.redirects).toContainEqual(
      expect.objectContaining({
        source: "/catalogue/thanh-thuy",
        destination: "/thuong-hieu/thanh-thuy/",
      }),
    );
    expect(readFileSync("public/_redirects", "utf8")).toContain(
      "/catalogue/thanh-thuy/ /thuong-hieu/thanh-thuy/ 301",
    );
  });
});
