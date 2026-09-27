import fs from "node:fs";
import path from "node:path";
import { fetchAuditResource } from "../lib/http-audit";
import { type PageSignals, comparePageSignals } from "../lib/hosting-parity";
import { parseHtmlSignals } from "../lib/live-seo-audit";

type Arguments = { current: string; candidate: string; output: string; concurrency: number };

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function parseArguments(): Arguments {
  const current = argument("--current");
  const candidate = argument("--candidate");
  if (!current || !candidate) throw new Error("Usage: tsx scripts/compare-hosting-parity.ts --current <origin> --candidate <origin> [--output <path>] [--concurrency <count>]");
  return {
    current: current.replace(/\/$/u, ""),
    candidate: candidate.replace(/\/$/u, ""),
    output: argument("--output") ?? "reports/hosting-parity.json",
    concurrency: Math.max(1, Number(argument("--concurrency") ?? 20)),
  };
}

function sitemapRoutes(xml: string, origin: string) {
  return [...new Set([...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu)].map((match) => {
    const url = new URL(match[1].trim());
    const expected = new URL(origin);
    if (url.origin !== expected.origin) throw new Error(`Sitemap URL has unexpected origin: ${url}`);
    return `${url.pathname}${url.search}`;
  }))];
}

async function auditPage(url: string): Promise<PageSignals> {
  const redirects: string[] = [];
  let currentUrl = url;
  for (let step = 0; step < 10; step += 1) {
    const response = await fetchAuditResource(currentUrl, "TungPhatHostingParity/1.0");
    if (!response.location || response.status < 300 || response.status >= 400) {
      const signals = parseHtmlSignals(response.body, response.headers);
      return {
        status: response.status,
        finalUrl: currentUrl,
        redirects,
        title: signals.title,
        canonical: signals.canonical,
        description: signals.description,
        robots: signals.robots,
        schemaCount: signals.schemaCount,
      };
    }
    currentUrl = new URL(response.location, currentUrl).toString();
    redirects.push(currentUrl);
  }
  throw new Error(`Redirect limit exceeded for ${url}`);
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, work: (value: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await work(values[index]);
    }
  }));
  return results;
}

async function main() {
  const options = parseArguments();
  const sitemap = await fetchAuditResource(`${options.current}/sitemap.xml`, "TungPhatHostingParity/1.0");
  if (sitemap.status !== 200) throw new Error(`Current sitemap returned ${sitemap.status}`);
  const routes = sitemapRoutes(sitemap.body, options.current);
  const pages = await mapConcurrent(routes, options.concurrency, async (route) => {
    const [current, candidate] = await Promise.all([
      auditPage(`${options.current}${route}`),
      auditPage(`${options.candidate}${route}`),
    ]);
    return { route, current, candidate, ...comparePageSignals(current, candidate) };
  });
  const result = {
    checkedAt: new Date().toISOString(),
    current: options.current,
    candidate: options.candidate,
    sitemapUrls: routes.length,
    mismatches: pages.filter((page) => page.mismatches.length),
    pages,
  };
  fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
  fs.writeFileSync(options.output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ sitemapUrls: result.sitemapUrls, mismatches: result.mismatches.length, output: options.output }, null, 2));
  if (result.mismatches.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
