import { opendir, readFile } from "node:fs/promises";
import path from "node:path";
import { auditMediaReferences, extractMediaReferences } from "../lib/media-cdn-audit";

const root = path.resolve(process.env.MEDIA_CDN_OUTPUT_DIR || "out");
const scannedExtensions = new Set([".css", ".html", ".js", ".json", ".txt", ".xml"]);

async function* files(directory: string): AsyncGenerator<string> {
  const entries = await opendir(directory);
  for await (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* files(target);
    else if (entry.isFile() && scannedExtensions.has(path.extname(entry.name))) yield target;
  }
}

async function main() {
  const references = new Set<string>();
  let filesScanned = 0;
  for await (const file of files(root)) {
    filesScanned += 1;
    const body = await readFile(file, "utf8");
    extractMediaReferences(body).forEach((reference) => references.add(reference));
  }

  const audit = auditMediaReferences(references);
  const { failures, ...counts } = audit;
  const result = { root, filesScanned, ...counts, failureCount: failures.length, failureSamples: failures.slice(0, 30) };
  console.log(JSON.stringify(result, null, 2));
  if (audit.failures.length) {
    console.error("Static output contains non-canonical first-party media references:");
    audit.failures.slice(0, 30).forEach((failure) => console.error(`- ${failure.reason}: ${failure.reference}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
