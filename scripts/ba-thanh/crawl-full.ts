import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { recognizeBaThanhDetail, reconcileBaThanhCode } from "@/lib/catalog/ba-thanh-source";
import { assertRobotsAllowed } from "@/lib/catalog/robots-policy";
import { CONCURRENCY, IMPORT_DIR, REQUEST_GAP_MS, USER_AGENT } from "./config";
import { fetchText, mapWithConcurrency, sleep, type FetchResponseMetadata } from "./http";

type LaminateSource = {
  sourceUrl: string;
  codeRaw: string;
  codeNormalized: string;
  status: string;
};

export async function crawlBaThanhFull(options: { refresh?: boolean } = {}) {
  const fullDiscoveryPath = path.join(IMPORT_DIR, "full-discovery.json");
  const fullDiscovery = JSON.parse(await fs.readFile(fullDiscoveryPath, "utf8"));
  const robots = await fetchText(String(fullDiscovery.robotsUrl), { refresh: options.refresh });
  const sources = JSON.parse(
    await fs.readFile(path.join(IMPORT_DIR, "discovered-laminate-codes.json"), "utf8"),
  ) as LaminateSource[];
  const details = await mapWithConcurrency(sources, CONCURRENCY, async (item) => {
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
        pageChecksum: createHash("sha256").update(html).digest("hex"),
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
  const successful = details.filter((item) => item.status === "PARSED");
  fullDiscovery.crawledAt = new Date().toISOString();
  fullDiscovery.laminateCrawl = {
    total: details.length,
    successful: successful.length,
    rejected: details.filter((item) => item.status === "REJECTED").length,
    failed: details.filter((item) => item.status === "FAILED").length,
  };
  if (details.length !== 33 || successful.length !== 33 || new Set(successful.map((item) => item.codeNormalized)).size !== 33) {
    throw new Error(`WAY Laminate crawl incomplete: ${successful.length}/${details.length} verified`);
  }
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-laminate-codes.json"), `${JSON.stringify(details, null, 2)}\n`);
  await fs.writeFile(fullDiscoveryPath, `${JSON.stringify(fullDiscovery, null, 2)}\n`);
  return { fullDiscovery, details };
}

if (process.argv[1]?.endsWith("crawl-full.ts")) {
  crawlBaThanhFull({ refresh: process.argv.includes("--refresh") }).then(({ fullDiscovery }) => {
    console.log(JSON.stringify({ command: "crawl:full", ...fullDiscovery.laminateCrawl }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
