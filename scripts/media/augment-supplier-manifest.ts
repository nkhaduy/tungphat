import fs from "node:fs";
import path from "node:path";
import type { MediaManifest, MediaManifestEntry } from "./core";

const root = process.cwd();
const manifestPath = path.join(root, "data/catalog-media-manifest.json");
async function main() {
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as MediaManifest;
const artifacts = ["an-cuong", "ba-thanh"].map((supplier) => path.join(root, `data/imports/${supplier}/color-media-discovery.json`)).filter(fs.existsSync);
const candidates = artifacts.flatMap((file) => {
  const artifact = JSON.parse(fs.readFileSync(file, "utf8")) as { entries: Array<{ localAssets?: Array<{ localPath: string; checksum?: string; mimeType?: string }> }> };
  return artifact.entries.flatMap((entry) => entry.localAssets ?? []);
});
const entries = new Map(manifest.entries.map((entry) => [entry.logicalPath, entry]));
let added = 0;

for (const asset of candidates) {
  const logicalPath = asset.localPath.replace(/^\//, "");
  if (entries.has(logicalPath) || !asset.checksum || !asset.mimeType) continue;
  const response = await fetch(`https://cms.mdftungphat.com/media/${logicalPath}`, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
  const bytes = Number(response.headers.get("content-length"));
  if (!response.ok || !Number.isSafeInteger(bytes) || bytes <= 0) throw new Error(`External media unavailable: ${logicalPath}`);
  const entry: MediaManifestEntry = { logicalPath, objectKey: logicalPath, sourcePath: `public/${logicalPath}`, sha256: asset.checksum, bytes, mimeType: asset.mimeType };
  entries.set(logicalPath, entry);
  added += 1;
}

manifest.entries = [...entries.values()].sort((left, right) => left.logicalPath.localeCompare(right.logicalPath));
manifest.summary.files = manifest.entries.length + Object.keys(manifest.aliases).length;
manifest.summary.bytes = manifest.entries.reduce((sum, entry) => sum + entry.bytes, 0);
manifest.summary.uniqueObjects = manifest.entries.length;
manifest.summary.uniqueBytes = manifest.summary.bytes;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ added, entries: manifest.entries.length }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
