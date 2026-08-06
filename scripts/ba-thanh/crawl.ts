import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { recognizeBaThanhDetail, reconcileBaThanhCode } from "@/lib/catalog/ba-thanh-source";
import { assertRobotsAllowed } from "@/lib/catalog/robots-policy";
import { IMPORT_DIR, CONCURRENCY, REQUEST_GAP_MS, USER_AGENT } from "./config";
import { fetchText, mapWithConcurrency, sleep, type FetchResponseMetadata } from "./http";

type Discovered = {
  sourceUrl: string;
  codeRaw: string;
  codeNormalized: string;
  category: string;
};

export async function crawlBaThanhDetails(options: { refresh?: boolean } = {}) {
  const discovered = JSON.parse(await fs.readFile(path.join(IMPORT_DIR, "discovered-codes.json"), "utf8")) as Discovered[];
  const manifestPath = path.join(IMPORT_DIR, "source-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const robots = String(manifest.robots || "");
  const details = await mapWithConcurrency(discovered, CONCURRENCY, async (item) => {
    await sleep(REQUEST_GAP_MS);
    try {
      let responseMetadata: FetchResponseMetadata = { finalUrl: item.sourceUrl, redirects: [], fromCache: false };
      const html = await fetchText(item.sourceUrl, {
        refresh: options.refresh,
        validateUrl: (url) => assertRobotsAllowed(robots, USER_AGENT, url),
        onResponse: (metadata) => { responseMetadata = metadata; },
      });
      const parsed = recognizeBaThanhDetail(html, { expectedCode: item.codeNormalized, sourceUrl: item.sourceUrl });
      const reconciled = parsed.accepted ? reconcileBaThanhCode(item.codeRaw, parsed.verifiedCodeRaw) : {};
      return {
        ...item,
        ...reconciled,
        status: parsed.accepted ? "PARSED" : "REJECTED",
        httpStatus: 200,
        finalUrl: responseMetadata.finalUrl,
        redirects: responseMetadata.redirects,
        pageChecksum: crypto.createHash("sha256").update(html).digest("hex"),
        heading: parsed.heading,
        text: parsed.text,
        images: parsed.images,
      };
    } catch (error) {
      return {
        ...item,
        status: "FAILED",
        httpStatus: 0,
        finalUrl: item.sourceUrl,
        redirects: [],
        error: error instanceof Error ? error.message : String(error),
        images: [],
      };
    }
  });
  const byUrl = new Map(details.map((detail) => [detail.sourceUrl, detail]));
  manifest.crawledAt = new Date().toISOString();
  manifest.detailUrls = manifest.detailUrls.map((item: { url: string }) => ({ ...item, ...(byUrl.get(item.url) || {}) }));
  manifest.counts = {
    ...manifest.counts,
    uniqueCodes: new Set(details.map((detail) => detail.codeNormalized)).size,
    duplicateSourceCodes: details.length - new Set(details.map((detail) => detail.codeNormalized)).size,
    successful: details.filter((detail) => detail.status === "PARSED").length,
    redirected: details.filter((detail) => Array.isArray(detail.redirects) && detail.redirects.length > 0).length,
    failed: details.filter((detail) => detail.status === "FAILED").length,
    rejected: details.filter((detail) => detail.status === "REJECTED").length,
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-codes.json"), `${JSON.stringify(details, null, 2)}\n`);
  return { manifest, details };
}

if (process.argv[1]?.endsWith("crawl.ts")) {
  crawlBaThanhDetails({ refresh: process.argv.includes("--refresh") }).then(({ manifest }) => {
    console.log(JSON.stringify({ command: "crawl", ...manifest.counts }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
