import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  buildMediaManifest,
  classifyMediaPath,
  contentTypeForPath,
  extractCatalogueReferences,
  isMediaPath,
  logicalObjectKey,
  sha256File,
  type MediaInput,
  type MediaManifest,
} from "./core";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", ".vercel", ".worktrees", ".wrangler", "node_modules", "out", "playwright-report", "test-results"]);

function walk(directory: string, output: string[] = []): string[] {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else if (entry.isFile()) output.push(path.relative(root, absolute).replaceAll("\\", "/"));
  }
  return output;
}

function trackedFiles(): Set<string> {
  return new Set(execFileSync("git", ["ls-files", "-z"], { cwd: root }).toString("utf8").split("\0").filter(Boolean));
}

function committedManifest(): MediaManifest | undefined {
  try {
    return JSON.parse(execFileSync("git", ["show", "HEAD:data/catalog-media-manifest.json"], { cwd: root, maxBuffer: 32 * 1024 * 1024 }).toString("utf8")) as MediaManifest;
  } catch {
    return undefined;
  }
}

function preserveExternalizedEntries(manifest: MediaManifest): MediaManifest {
  const preserved = committedManifest();
  if (!preserved) return manifest;
  const entries = new Map(preserved.entries.map((entry) => [entry.logicalPath, entry]));
  for (const entry of manifest.entries) entries.set(entry.logicalPath, entry);
  const aliases = { ...preserved.aliases, ...manifest.aliases };
  const mergedEntries = [...entries.values()].sort((left, right) => left.logicalPath.localeCompare(right.logicalPath));
  return {
    ...manifest,
    entries: mergedEntries,
    aliases,
    summary: {
      files: mergedEntries.length + Object.keys(aliases).length,
      bytes: mergedEntries.reduce((sum, entry) => sum + entry.bytes, 0),
      uniqueObjects: mergedEntries.length,
      uniqueBytes: mergedEntries.reduce((sum, entry) => sum + entry.bytes, 0),
      duplicateFiles: Object.keys(aliases).length,
      reclaimableBytes: 0,
    },
  };
}

function catalogueReferences(tracked: Set<string>): Set<string> {
  const references = new Set<string>();
  for (const file of tracked) {
    if (isMediaPath(file)) continue;
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.statSync(absolute);
    if (!stat.isFile() || stat.size > 16 * 1024 * 1024) continue;
    const text = fs.readFileSync(absolute, "utf8");
    for (const reference of extractCatalogueReferences(text)) references.add(reference);
  }
  return references;
}

export function createMediaInventory() {
  const tracked = trackedFiles();
  const references = catalogueReferences(tracked);
  const records = walk(root).filter(isMediaPath).sort().map((file) => {
    const stat = fs.statSync(path.join(root, file));
    const classification = classifyMediaPath(file, stat.size);
    const logicalPath = file.startsWith("public/") ? logicalObjectKey(file) : undefined;
    const referenced = logicalPath?.startsWith("catalog/") ? references.has(logicalPath) : false;
    return {
      path: file,
      bytes: stat.size,
      tracked: tracked.has(file),
      referenced,
      ...classification,
      sha256: sha256File(path.join(root, file)),
      mimeType: contentTypeForPath(file),
    };
  });
  const retained = records.filter((record): record is typeof record & { path: `public/${string}` } =>
    record.externalize && record.path.startsWith("public/") && (!record.path.startsWith("public/catalog/") || record.referenced));
  const manifestInputs: MediaInput[] = retained.map((record) => ({
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mimeType: record.mimeType,
    referenced: record.referenced,
  }));
  const manifest = preserveExternalizedEntries(buildMediaManifest(manifestInputs));
  const inventory = {
    generatedAt: manifest.generatedAt,
    summary: {
      totalMediaFiles: records.length,
      totalMediaBytes: records.reduce((sum, record) => sum + record.bytes, 0),
      trackedFiles: records.filter((record) => record.tracked).length,
      trackedBytes: records.filter((record) => record.tracked).reduce((sum, record) => sum + record.bytes, 0),
      referencedFiles: records.filter((record) => record.referenced).length,
      referencedBytes: records.filter((record) => record.referenced).reduce((sum, record) => sum + record.bytes, 0),
      unreferencedExternalFiles: records.filter((record) => record.externalize && !record.referenced).length,
      unreferencedExternalBytes: records.filter((record) => record.externalize && !record.referenced).reduce((sum, record) => sum + record.bytes, 0),
      retainedFiles: manifest.summary.files,
      retainedBytes: manifest.summary.bytes,
      uniqueObjects: manifest.summary.uniqueObjects,
      uniqueBytes: manifest.summary.uniqueBytes,
      duplicateFiles: manifest.summary.duplicateFiles,
      reclaimableBytes: manifest.summary.reclaimableBytes,
    },
    records,
  };
  return { inventory, manifest };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { inventory, manifest } = createMediaInventory();
  fs.mkdirSync(path.join(root, "reports"), { recursive: true });
  fs.mkdirSync(path.join(root, "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "reports/media-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "data/catalog-media-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(inventory.summary, null, 2));
}
