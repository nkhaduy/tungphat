import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildExportBundle, stableStringify, writeExportBundle } from "../../scripts/ancuong/export";
import { renderPipelineReport } from "../../scripts/ancuong/report";

describe("An Cuong export contract", () => {
  it("serializes object keys stably without reordering arrays", () => {
    expect(stableStringify({ z: 1, nested: { b: 2, a: 1 }, items: ["b", "a"] }))
      .toBe('{\n  "items": [\n    "b",\n    "a"\n  ],\n  "nested": {\n    "a": 1,\n    "b": 2\n  },\n  "z": 1\n}\n');
  });

  it("writes the six versioned exports atomically with checksums", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "ancuong-export-"));
    const bundle = buildExportBundle({
      products: [{ sourceId: "2", productCode: "B" }, { sourceId: "1", productCode: "A" }],
      categories: [{ slug: "melamine", name: "Melamine" }],
      taxonomy: { facets: [] },
      relations: [],
      media: [],
    }, {
      schemaVersion: "1.0.0",
      parserVersion: "1.0.0",
      exportTime: "2026-08-04T00:00:00.000Z",
      sourceRoot: "https://ancuong.com/online-catalogue/catalogue-vat-lieu.html",
      sourceAuditReference: "docs/catalog/ancuong/ANCUONG_SOURCE_AUDIT.md",
      validationStatus: "passed",
    });
    await writeExportBundle(outputDir, bundle);

    expect((await readdir(outputDir)).sort()).toEqual([
      "catalogue.json",
      "categories.json",
      "export-manifest.json",
      "media.json",
      "relations.json",
      "taxonomy.json",
    ]);
    const manifest = JSON.parse(await readFile(path.join(outputDir, "export-manifest.json"), "utf8"));
    expect(manifest.exports).toHaveLength(5);
    expect(manifest.exports.every((entry: { checksum: string }) => /^[a-f0-9]{64}$/.test(entry.checksum))).toBe(true);
    expect(manifest.exports.find((entry: { file: string }) => entry.file === "catalogue.json").recordCount).toBe(2);
    expect(await readdir(outputDir)).not.toContain(expect.stringMatching(/\.tmp/));
  });

  it("renders a deterministic markdown report from pipeline counts", () => {
    const report = renderPipelineReport({
      title: "An Cuong validation",
      generatedAt: "2026-08-04T00:00:00.000Z",
      sections: [{ heading: "Quality", values: { Invalid: 0, Valid: 12 } }],
    });
    expect(report).toContain("# An Cuong validation");
    expect(report).toContain("- Invalid: 0\n- Valid: 12");
  });
});
