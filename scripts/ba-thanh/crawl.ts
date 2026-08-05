import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { recognizeBaThanhDetail, reconcileBaThanhCode } from "@/lib/catalog/ba-thanh-source";
import { IMPORT_DIR, CONCURRENCY, REQUEST_GAP_MS } from "./config";
import { fetchText, mapWithConcurrency, sleep } from "./http";

type Discovered = {
  sourceUrl: string;
  codeRaw: string;
  codeNormalized: string;
  category: string;
};

export async function crawlBaThanhDetails() {
  const discovered = JSON.parse(await fs.readFile(path.join(IMPORT_DIR, "discovered-codes.json"), "utf8")) as Discovered[];
  const details = await mapWithConcurrency(discovered, CONCURRENCY, async (item) => {
    await sleep(REQUEST_GAP_MS);
    try {
      const html = await fetchText(item.sourceUrl);
      const parsed = recognizeBaThanhDetail(html, { expectedCode: item.codeNormalized, sourceUrl: item.sourceUrl });
      const reconciled = parsed.accepted ? reconcileBaThanhCode(item.codeRaw, parsed.verifiedCodeRaw) : {};
      return {
        ...item,
        ...reconciled,
        status: parsed.accepted ? "PARSED" : "REJECTED",
        httpStatus: 200,
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
        error: error instanceof Error ? error.message : String(error),
        images: [],
      };
    }
  });
  const manifestPath = path.join(IMPORT_DIR, "source-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const byUrl = new Map(details.map((detail) => [detail.sourceUrl, detail]));
  manifest.crawledAt = new Date().toISOString();
  manifest.detailUrls = manifest.detailUrls.map((item: { url: string }) => ({ ...item, ...(byUrl.get(item.url) || {}) }));
  manifest.counts = {
    ...manifest.counts,
    uniqueCodes: new Set(details.map((detail) => detail.codeNormalized)).size,
    duplicateSourceCodes: details.length - new Set(details.map((detail) => detail.codeNormalized)).size,
    successful: details.filter((detail) => detail.status === "PARSED").length,
    redirected: 0,
    failed: details.filter((detail) => detail.status === "FAILED").length,
    rejected: details.filter((detail) => detail.status === "REJECTED").length,
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-codes.json"), `${JSON.stringify(details, null, 2)}\n`);
  return { manifest, details };
}

if (process.argv[1]?.endsWith("crawl.ts")) {
  crawlBaThanhDetails().then(({ manifest }) => {
    console.log(JSON.stringify({ command: "crawl", ...manifest.counts }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
