import fs from "node:fs";
import path from "node:path";

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
