import fs from "node:fs/promises";
import path from "node:path";
import type { SupplierColorCode } from "@/lib/catalog/types";
import { CATALOG_PATH, IMPORT_DIR } from "./config";

function words(value: string) {
  return new Set(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{3,}/g) || []);
}

function overlap(a: string, b: string) {
  const left = words(a);
  const right = words(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const word of left) if (right.has(word)) common += 1;
  return common / Math.min(left.size, right.size);
}

export async function auditBaThanhDuplication() {
  const records = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8")) as SupplierColorCode[];
  const findings = records.map((record) => {
    const sourceText = typeof record.sourceData.detailText === "string" ? record.sourceData.detailText : "";
    const editorial = record.editorialDescription || "";
    const score = overlap(editorial, sourceText);
    return {
      id: record.id,
      code: record.displayName,
      sourceFactsAllowed: [record.codeRaw, record.patternGroup].filter(Boolean),
      editorialPresent: Boolean(editorial),
      sourceTextOverlap: Number(score.toFixed(3)),
      status: !editorial ? "NEEDS_ENRICHMENT" : score >= 0.75 ? "REVIEW_HIGH_OVERLAP" : "OK",
    };
  });
  const report = {
    auditedAt: new Date().toISOString(),
    total: records.length,
    highOverlap: findings.filter((item) => item.status === "REVIEW_HIGH_OVERLAP").length,
    needsEnrichment: findings.filter((item) => item.status === "NEEDS_ENRICHMENT").length,
    findings,
  };
  await fs.writeFile(path.join(IMPORT_DIR, "duplication-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
  const markdown = [
    "# Ba Thanh Duplication Audit",
    "",
    `- Audited: ${report.auditedAt}`,
    `- Records: ${report.total}`,
    `- High-overlap findings: ${report.highOverlap}`,
    `- Needs enrichment: ${report.needsEnrichment}`,
    "",
    "## Policy",
    "",
    "Codes, supplier name, source grouping and verified dimensions are source facts. Tùng Phát landing copy, applications, CTA, FAQ, metadata and service guidance are editorial and must be written independently.",
    "",
    "## Findings",
    "",
    ...findings.filter((item) => item.status !== "OK").slice(0, 80).map((item) => `- ${item.code}: ${item.status}; source overlap ${item.sourceTextOverlap}`),
    "",
    "Records marked `NEEDS_ENRICHMENT` remain noindex and are excluded from sitemap output until editorial review adds distinct value.",
    "",
  ].join("\n");
  await fs.writeFile(path.join(process.cwd(), "docs", "seo", "BA_THANH_DUPLICATION_AUDIT.md"), markdown);
  return report;
}

if (process.argv[1]?.endsWith("duplication-audit.ts")) {
  auditBaThanhDuplication().then((report) => console.log(JSON.stringify({ command: "audit", total: report.total, highOverlap: report.highOverlap }, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
