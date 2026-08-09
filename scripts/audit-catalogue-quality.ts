import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { auditCataloguePages } from "../lib/catalogue-quality";

const outputDirectory = process.env.CATALOGUE_OUTPUT_DIR ?? "out";
const sitemapPath = path.join(outputDirectory, "sitemap.xml");
if (!existsSync(sitemapPath)) throw new Error(`Missing sitemap: ${sitemapPath}`);

const sitemapUrls = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const report = auditCataloguePages({
  sitemapUrls,
  readHtml(url) {
    const pathname = new URL(url).pathname;
    const file = pathname === "/"
      ? path.join(outputDirectory, "index.html")
      : path.join(outputDirectory, pathname, "index.html");
    if (!existsSync(file)) throw new Error(`Missing catalogue HTML: ${file}`);
    return readFileSync(file, "utf8");
  },
});

const reportPath = process.env.CATALOGUE_QUALITY_OUTPUT;
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
if (report.summary.failed || report.configurationErrors.length) process.exitCode = 1;
