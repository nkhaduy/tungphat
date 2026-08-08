import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCatalogueDocumentRecords, parseCatalogueDocumentLinks, run } from "@/scripts/ancuong/discover-documents";
import type { CliOptions } from "@/scripts/ancuong/types";

const options: CliOptions = { dryRun: false, resume: false, force: false, concurrency: 2, changedOnly: false, skipMedia: false, verbose: false };

describe("An Cuong catalogue documents", () => {
  it("discovers only official public catalogue viewers and retains the index-page provenance", () => {
    const parentUrl = "https://ancuong.com/catalogue/catalogue-material.html";
    const links = parseCatalogueDocumentLinks(`
      <a href="https://catalogue.ancuong.com/innovative-mfc-mdf-melamine-panels/">Melamine catalogue</a>
      <a href="https://example.com/unofficial.pdf">Unofficial</a>
      <a href="/tin-tuc/article.html">News</a>
    `, parentUrl);

    expect(links).toEqual([{
      sourceUrl: "https://catalogue.ancuong.com/innovative-mfc-mdf-melamine-panels/",
      sourceParent: parentUrl,
      title: "Melamine catalogue",
    }]);
    expect(buildCatalogueDocumentRecords(links)).toEqual([
      expect.objectContaining({
        recordType: "document",
        supplier: "an-cuong",
        name: "Melamine catalogue",
        documentType: "catalogue",
        sourceUrls: [
          "https://ancuong.com/catalogue/catalogue-material.html",
          "https://catalogue.ancuong.com/innovative-mfc-mdf-melamine-panels/",
        ],
        documents: [expect.objectContaining({
          sourceUrl: "https://catalogue.ancuong.com/innovative-mfc-mdf-melamine-panels/",
          title: "Melamine catalogue",
        })],
        needsEditorialReview: false,
        editorialStatus: "SOURCE_ONLY",
        seoStatus: "SOURCE_ONLY",
      }),
    ]);
  });

  it("verifies public catalogue targets and writes a source-only color-map record", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ancuong-documents-"));
    const outputPath = join(directory, "documents.json");
    const indexUrl = "https://ancuong.com/catalogue/catalogue-material.html";
    const targetUrl = "https://catalogue.ancuong.com/innovative-mfc-mdf-melamine-panels/";
    const colorMapUrl = "https://ancuong.com/color-map.html";
    const fetched: string[] = [];
    const records = await run(options, {
      indexUrls: [indexUrl],
      colorMapUrl,
      outputPath,
      fetchText: async (url) => {
        fetched.push(url);
        if (url === indexUrl) return { body: `<a href="${targetUrl}">Melamine catalogue</a>`, status: 200, contentHash: "a".repeat(64) };
        return { body: "<title>Public source</title>", status: 200, contentHash: "b".repeat(64) };
      },
    });

    expect(fetched).toEqual([indexUrl, targetUrl, colorMapUrl]);
    expect(records).toHaveLength(2);
    expect(records).toContainEqual(expect.objectContaining({ documentType: "color-map", needsEditorialReview: true }));
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toEqual(records);
  });
});
