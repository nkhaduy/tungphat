import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { extractBaThanhIndex } from "@/lib/catalog/ba-thanh-source";
import { normalizeSupplierCode } from "@/lib/catalog/normalize-code";
import { assertRobotsAllowed } from "@/lib/catalog/robots-policy";
import { SOURCE_INDEX_URL, SOURCE_ROBOTS_URL, IMPORT_DIR, USER_AGENT } from "./config";
import { fetchText } from "./http";

export async function discoverBaThanh(options: { refresh?: boolean } = {}) {
  const robots = await fetchText(SOURCE_ROBOTS_URL, { refresh: options.refresh });
  assertRobotsAllowed(robots, USER_AGENT, SOURCE_INDEX_URL);
  const html = await fetchText(SOURCE_INDEX_URL, {
    refresh: options.refresh,
    validateUrl: (url) => assertRobotsAllowed(robots, USER_AGENT, url),
  });
  const parsed = extractBaThanhIndex(html, SOURCE_INDEX_URL);
  const crawledAt = new Date().toISOString();
  const sourceChecksum = crypto.createHash("sha256").update(html).digest("hex");
  const discovered = parsed.items.map((item) => {
    const normalized = normalizeSupplierCode(item.codeRaw);
    return {
      ...item,
      id: `ba-thanh:${normalized.normalized}`,
      codeNormalized: normalized.normalized,
      displayName: normalized.display,
      slug: normalized.slug,
      confident: normalized.confident,
      sourceIndexUrl: SOURCE_INDEX_URL,
      discoveredAt: crawledAt,
    };
  });
  const unique = new Map<string, (typeof discovered)[number]>();
  let duplicateRows = 0;
  for (const item of discovered) {
    const key = `${item.codeNormalized}:${item.sourceUrl}`;
    if (unique.has(key)) duplicateRows += 1;
    else unique.set(key, item);
  }
  const uniqueCodes = [...unique.values()];
  const codeCounts = new Map<string, number>();
  for (const item of uniqueCodes) codeCounts.set(item.codeNormalized, (codeCounts.get(item.codeNormalized) || 0) + 1);
  const duplicateSourceCodes = [...codeCounts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
  const manifest = {
    indexUrl: SOURCE_INDEX_URL,
    robotsUrl: SOURCE_ROBOTS_URL,
    crawledAt,
    httpStatus: { robots: 200, index: 200 },
    robots,
    indexChecksum: sourceChecksum,
    categories: parsed.categories,
    detailUrls: uniqueCodes.map((item) => ({
      url: item.sourceUrl,
      codeRaw: item.codeRaw,
      codeNormalized: item.codeNormalized,
      category: item.category,
      status: "DISCOVERED",
    })),
    counts: {
      detailUrls: uniqueCodes.length,
      uniqueCodes: new Set(uniqueCodes.map((item) => item.codeNormalized)).size,
      duplicateSourceCodes,
      duplicateRows,
      categories: Object.fromEntries(parsed.categories.map((category) => [category.slug, uniqueCodes.filter((item) => item.category === category.slug).length])),
    },
  };
  await fs.mkdir(IMPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(IMPORT_DIR, "source-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-codes.json"), `${JSON.stringify(uniqueCodes, null, 2)}\n`);
  return { manifest, discovered: uniqueCodes };
}

if (process.argv[1]?.endsWith("discover.ts")) {
  discoverBaThanh({ refresh: process.argv.includes("--refresh") }).then(({ manifest }) => {
    console.log(JSON.stringify({ command: "discover", ...manifest.counts }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
