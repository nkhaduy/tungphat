import { describe, expect, it } from "vitest";
import {
  DEFAULT_JS_BUDGETS,
  measureRouteBundles,
  validateJsBudgets,
} from "@/lib/performance-budgets";

describe("route JavaScript budgets", () => {
  it("measures the shared and key route bundles from a build manifest", () => {
    const manifest = {
      rootMainFiles: ["static/chunks/shared.js"],
      pages: {
        "/page": ["static/chunks/shared.js", "static/chunks/home.js"],
        "/tham-chieu-vat-lieu/page": [
          "static/chunks/shared.js",
          "static/chunks/reference.js",
        ],
        "/catalogue/page": [
          "static/chunks/shared.js",
          "static/chunks/catalogue.js",
        ],
      },
    };
    const sizes = new Map([
      ["static/chunks/shared.js", 100],
      ["static/chunks/home.js", 20],
      ["static/chunks/reference.js", 30],
      ["static/chunks/catalogue.js", 40],
    ]);

    expect(measureRouteBundles(manifest, (file) => sizes.get(file) ?? 0)).toEqual({
      shared: { parsedBytes: 100 },
      homepage: { parsedBytes: 120 },
      referenceCenter: { parsedBytes: 130 },
      catalogue: { parsedBytes: 140 },
    });
  });

  it("rejects a meaningful budget regression", () => {
    const measured = {
      shared: { parsedBytes: DEFAULT_JS_BUDGETS.sharedParsedBytes + 1 },
      homepage: { parsedBytes: 0 },
      referenceCenter: { parsedBytes: 0 },
      catalogue: { parsedBytes: 0 },
    };

    expect(validateJsBudgets(measured)).toEqual([
      expect.stringContaining("shared"),
    ]);
  });
});
