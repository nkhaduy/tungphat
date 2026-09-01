import { describe, expect, it } from "vitest";
import { findReferencedExportAssetPaths } from "../scripts/lib/export-image-source-references.mjs";

describe("export image source reference scan", () => {
  it("keeps a legacy asset when any exported text file references its public path", () => {
    const referenced = findReferencedExportAssetPaths(
      ["out/one.html", "out/two.css", "out/ignored.webp"],
      ["/images/kept.png", "/images/unused.jpg"],
      (file) => ({
        "out/one.html": '<img src="/images/kept.png">',
        "out/two.css": "body { color: black; }",
        "out/ignored.webp": "",
      })[file] ?? "",
    );

    expect([...referenced]).toEqual(["/images/kept.png"]);
  });

  it("does not require a combined copy of all export text to find a later reference", () => {
    const referenced = findReferencedExportAssetPaths(
      ["out/first.html", "out/second.html"],
      ["/images/later.png"],
      (file) => file === "out/second.html" ? 'url("/images/later.png")' : "x".repeat(200_000),
    );

    expect([...referenced]).toEqual(["/images/later.png"]);
  });
});
