import fs from "node:fs";
import { auditStaticOutput } from "@/lib/seo-output-audit";

const rootDir = process.env.SEO_OUTPUT_DIR ?? "out";
const siteUrl = process.env.SEO_SITE_URL ?? "https://mdftungphat.com";
const result = auditStaticOutput({
  rootDir,
  siteUrl,
  // The homepage uses a focused hero and conversion path; direct-answer blocks
  // remain required on the dedicated informational and service routes.
  expectedDirectAnswerRoutes: ["/san-pham/", "/tham-chieu-vat-lieu/", "/gia-cong-cnc/", "/van-mdf/", "/mdf-chong-am/", "/van-go-cong-nghiep/", "/go-ghep/", "/go-ghep-cao-su/", "/go-ghep-tram/", "/cat-cnc-go/", "/gia-cong-cnc-mdf/"],
});
const outputPath = process.env.SEO_AUDIT_JSON;
if (outputPath) fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));

const blocking = ["invalidCanonicals", "duplicateTitles", "duplicateDescriptions", "brokenLinks", "schemaErrors", "sitemapErrors", "thinIndexablePages", "aiCrawlerBlockers"] as const;
const failures: string[] = blocking.filter((key) => result[key] > 0);
if (result.missingDirectAnswerRoutes.length) failures.push("missingDirectAnswerRoutes");
if (failures.length) {
  console.error(`SEO output audit failed: ${failures.join(", ")}`);
  process.exit(1);
}
