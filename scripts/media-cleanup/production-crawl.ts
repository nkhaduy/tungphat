import fs from "node:fs";
import path from "node:path";

type CrawlImage = { role: string; sourceUrl: string; localPath?: string; thumbnailSrc?: string; originalUrl?: string };
type CrawlRecord = { id: string; codeRaw: string; canonicalRoute: string; supplier: string; images: CrawlImage[] };

export function buildAnCuongCrawlTargets(records: CrawlRecord[]) {
  const scoped = records.filter((record) => record.supplier === "an-cuong");
  const pages = scoped.map((record) => ({
    id: record.id,
    code: record.codeRaw,
    route: record.canonicalRoute,
    hero: record.images[0]?.thumbnailSrc || record.images[0]?.localPath,
  }));
  const media = new Set<string>();
  for (const record of scoped) {
    for (const image of record.images) {
      if (image.thumbnailSrc) media.add(image.thumbnailSrc);
      if (image.localPath) media.add(image.localPath);
      if (image.originalUrl) media.add(image.originalUrl);
    }
  }
  return { pages, media };
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, worker: (value: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < values.length) {
      const index = next++;
      output[index] = await worker(values[index]);
    }
  }));
  return output;
}

async function main() {
  const root = process.cwd();
  const artifact = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/supplier-color-codes.json"), "utf8")) as { records: CrawlRecord[] };
  const targets = buildAnCuongCrawlTargets(artifact.records);
  const origin = process.env.PRODUCTION_ORIGIN || "https://mdftungphat.com";
  const pageResults = await mapConcurrent(targets.pages, 24, async (page) => {
    try {
      const response = await fetch(new URL(page.route, origin), { headers: { "user-agent": "TungPhatProductionMediaAudit/1.0" } });
      const html = await response.text();
      return { ...page, status: response.status, ok: response.ok && html.includes(page.code) && !html.includes('src=""') && (!page.hero || html.includes(page.hero)) };
    } catch (error) {
      return { ...page, status: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  const mediaResults = await mapConcurrent([...targets.media], 32, async (target) => {
    const url = target.startsWith("http") ? target : new URL(target, origin).toString();
    try {
      const response = await fetch(url, { method: "HEAD", headers: { "user-agent": "TungPhatProductionMediaAudit/1.0" } });
      const type = response.headers.get("content-type") || "";
      const size = Number(response.headers.get("content-length") || 0);
      return { target, url, status: response.status, contentType: type, size, ok: response.ok && type.startsWith("image/") };
    } catch (error) {
      return { target, url, status: 0, contentType: "", size: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  const report = {
    generatedAt: new Date().toISOString(),
    pagesAudited: pageResults.length,
    pagesFailed: pageResults.filter((result) => !result.ok),
    mediaAudited: mediaResults.length,
    mediaFailed: mediaResults.filter((result) => !result.ok),
  };
  const output = process.env.PRODUCTION_CRAWL_OUTPUT || "/tmp/an-cuong-production-crawl.json";
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output, pagesAudited: report.pagesAudited, pagesFailed: report.pagesFailed.length, mediaAudited: report.mediaAudited, mediaFailed: report.mediaFailed.length }, null, 2));
  if (report.pagesFailed.length || report.mediaFailed.length) process.exitCode = 1;
}

if (process.argv[1]?.endsWith("production-crawl.ts")) void main();
