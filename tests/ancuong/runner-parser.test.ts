import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run as runDiscover } from "@/scripts/ancuong/discover";
import { run as runListings } from "@/scripts/ancuong/crawl-listings";
import { run as runDetails } from "@/scripts/ancuong/crawl-details";
import { run as runRelations } from "@/scripts/ancuong/crawl-relations";
import type { CliOptions } from "@/scripts/ancuong/types";

const fixture = (name: string) => readFile(join(process.cwd(), "tests/fixtures/ancuong", name), "utf8");
const options: CliOptions = { dryRun: false, resume: false, force: false, concurrency: 2, changedOnly: false, skipMedia: false, verbose: false };

describe("An Cuong parser runners", () => {
  it("writes discovery, listing, detail and explicit relation contracts from cached SSR HTML", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ancuong-parser-runners-"));
    const discoveryPath = join(directory, "reports", "discovery-manifest.json");
    const listingsPath = join(directory, "raw", "listings.json");
    const detailsPath = join(directory, "raw", "details.json");
    const relationsPath = join(directory, "normalized", "relations.json");
    const stateDirectory = join(directory, "state");
    const rootHtml = await fixture("catalogue-root.html");
    const listingHtml = await fixture("melamine-listing.html");
    const detailHtml = await fixture("melamine-detail.html");

    const discovery = await runDiscover(options, {
      outputPath: discoveryPath,
      fetchText: async () => ({ body: rootHtml, contentHash: "1".repeat(64) }),
      now: () => "2026-08-04T00:00:00.000Z"
    });
    expect(discovery.categories.map((item) => item.slug)).toEqual(["acrylic", "chi-dan-canh-pvc", "laminate", "melamine"]);

    await writeFile(discoveryPath, `${JSON.stringify({ ...discovery, categories: discovery.categories.filter((item) => item.slug === "melamine") }, null, 2)}\n`);
    const listings = await runListings(options, {
      discoveryPath,
      outputPath: listingsPath,
      statePath: join(stateDirectory, "listings.json"),
      fetchText: async () => ({ body: listingHtml, contentHash: "2".repeat(64) }),
      now: () => "2026-08-04T00:01:00.000Z"
    });
    expect(listings).toHaveLength(2);
    expect(JSON.parse(await readFile(discoveryPath, "utf8")).productUrls).toEqual([
      "https://ancuong.com/melamine/303000078.html",
      "https://ancuong.com/melamine/303003551.html"
    ]);

    const details = await runDetails({ ...options, limit: 1 }, {
      listingsPath,
      outputPath: detailsPath,
      statePath: join(stateDirectory, "details.json"),
      fetchText: async () => ({ body: detailHtml, contentHash: "3".repeat(64) }),
      now: () => "2026-08-04T00:02:00.000Z"
    });
    expect(details).toHaveLength(1);
    expect(details[0]).toEqual(expect.objectContaining({ sourceId: "303000078", productCode: "MFC - MS 106 SH" }));

    const relations = await runRelations(options, { detailsPath, outputPath: relationsPath });
    expect(relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: "303000078", relationType: "same-color", targetSourceId: "303000849" }),
      expect.objectContaining({ sourceId: "303000078", relationType: "application", targetSourceId: "1071" })
    ]));
  });

  it("limits changed-only detail fetches to URLs named by the latest diff", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ancuong-changed-only-"));
    const listingsPath = join(directory, "listings.json");
    const diffPath = join(directory, "latest-diff.json");
    const outputPath = join(directory, "details.json");
    const statePath = join(directory, "state.json");
    const listing = {
      sourceId: "303000078", sourceUrl: "https://ancuong.com/melamine/303000078.html", category: "Melamine", categorySlug: "melamine", productCode: "MFC - MS 106 SH", name: "Milky White", facetKeys: {}
    };
    await writeFile(listingsPath, `${JSON.stringify([listing, { ...listing, sourceId: "303003551", sourceUrl: "https://ancuong.com/melamine/303003551.html" }])}\n`);
    await writeFile(diffPath, `${JSON.stringify({ entries: [{ classification: "UPDATED", sourceUrl: listing.sourceUrl }] })}\n`);
    const fetched: string[] = [];
    const details = await runDetails({ ...options, changedOnly: true }, {
      listingsPath, diffPath, outputPath, statePath,
      fetchText: async (url) => { fetched.push(url); return { body: await fixture("melamine-detail.html"), contentHash: "4".repeat(64) }; },
      now: () => "2026-08-04T00:03:00.000Z"
    });
    expect(fetched).toEqual([listing.sourceUrl]);
    expect(details).toHaveLength(1);
  });
});
