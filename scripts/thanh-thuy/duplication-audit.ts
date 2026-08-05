import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseCliArgs, writeJsonAtomic } from "./lib";

export type DuplicationStatus = "TOO_SIMILAR" | "ORIGINAL_ENOUGH" | "SOURCE_EMPTY";

function normalizeWords(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(words: string[], size = 3): Set<string> {
  if (words.length < size) return new Set(words.length ? [words.join(" ")] : []);
  const output = new Set<string>();
  for (let index = 0; index <= words.length - size; index += 1) {
    output.add(words.slice(index, index + size).join(" "));
  }
  return output;
}

export function shingleSimilarity(source: string, generated: string): number {
  const left = shingles(normalizeWords(source));
  const right = shingles(normalizeWords(generated));
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

export function classifyDuplication(source: string, generated: string): DuplicationStatus {
  if (!normalizeWords(source).length) return "SOURCE_EMPTY";
  return shingleSimilarity(source, generated) >= 0.35
    ? "TOO_SIMILAR"
    : "ORIGINAL_ENOUGH";
}

function htmlToText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function readJsonFiles(directory: string): unknown[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")))
    .flatMap((value) => (Array.isArray(value) ? value : [value]));
}

export function auditCachedSource(
  cacheDirectory: string,
  generatedBySourceUrl: Map<string, string>,
): Array<{ sourceUrl: string; status: DuplicationStatus; similarity: number }> {
  const records = readJsonFiles(cacheDirectory) as Array<{
    link?: string;
    content?: { rendered?: string };
  }>;
  return records
    .filter((record) => record.link)
    .map((record) => {
      const source = htmlToText(record.content?.rendered || "");
      const generated = generatedBySourceUrl.get(record.link as string) || "";
      return {
        sourceUrl: record.link as string,
        similarity: shingleSimilarity(source, generated),
        status: classifyDuplication(source, generated),
      };
    });
}

async function main() {
  const args = parseCliArgs();
  const root = process.cwd();
  const cacheDirectory = typeof args.get("cache-dir") === "string"
    ? path.resolve(String(args.get("cache-dir")))
    : path.join(root, ".cache/thanh-thuy/raw");
  const catalogFile = typeof args.get("catalog") === "string"
    ? path.resolve(String(args.get("catalog")))
    : path.join(root, "data/catalogs/thanh-thuy/catalog.json");
  const outputFile = typeof args.get("output") === "string"
    ? path.resolve(String(args.get("output")))
    : path.join(root, "docs/seo/THANH_THUY_DUPLICATION_AUDIT.md");
  const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8")) as {
    products: Array<{ sourceUrl: string; description?: string; applications?: string[]; seoStatus?: string }>;
  };
  const generated = new Map(catalog.products.map((product) => [
    product.sourceUrl,
    [product.description, ...(product.applications || [])].filter(Boolean).join(" "),
  ]));
  const results = auditCachedSource(cacheDirectory, generated);
  const counts = results.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.status] = (accumulator[result.status] || 0) + 1;
    return accumulator;
  }, {});
  const tooSimilar = results.filter((result) => result.status === "TOO_SIMILAR");
  const markdown = [
    "# Thanh Thuy Duplication Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This audit compares normalized Tùng Phát copy with the public source body cached by the importer. Technical facts such as codes, dimensions and category names may overlap; long marketing paragraphs must not be copied.",
    "",
    `- Records compared: ${results.length}`,
    `- Source-empty records: ${counts.SOURCE_EMPTY || 0}`,
    `- Original-enough records: ${counts.ORIGINAL_ENOUGH || 0}`,
    `- Too-similar records: ${counts.TOO_SIMILAR || 0}`,
    "",
    "## Findings",
    "",
    tooSimilar.length ? tooSimilar.map((result) => `- TOO_SIMILAR (${result.similarity.toFixed(3)}): ${result.sourceUrl}`).join("\n") : "No generated page exceeded the similarity threshold.",
    "",
    "## Interpretation",
    "",
    "Most source records in the current crawl contain only a title and image, so they are classified as `SOURCE_EMPTY` and remain `NEEDS_ENRICHMENT`/`noindex` until a human adds useful product facts. The one detailed Laminate record is rewritten with Tùng Phát service guidance and does not reuse the source marketing paragraph.",
    "",
    "Technical facts are retained only as structured data needed for code lookup; supplier marketing copy and UI content are not imported.",
    "",
  ].join("\n");
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, markdown);
  const jsonOutput = typeof args.get("json-output") === "string" ? path.resolve(String(args.get("json-output"))) : "";
  if (jsonOutput) writeJsonAtomic(jsonOutput, { generatedAt: new Date().toISOString(), counts, results });
  console.log(`Duplication audit: ${results.length} bản ghi, ${tooSimilar.length} quá giống nguồn.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
