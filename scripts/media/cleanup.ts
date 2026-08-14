import fs from "node:fs";
import path from "node:path";
import type { MediaManifest } from "./core";
import { sha256File } from "./core";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/catalog-media-manifest.json"), "utf8")) as MediaManifest;
const known = new Map(manifest.entries.map((entry) => [entry.sourcePath, entry.sha256]));
const catalogRoot = path.join(root, "public/catalog");

function files(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? files(absolute) : [absolute];
  });
}

for (const absolute of files(catalogRoot)) {
  const relative = path.relative(root, absolute).replaceAll("\\", "/");
  const expected = known.get(relative);
  if (expected && sha256File(absolute) !== expected) throw new Error(`Refusing to clean changed media before sync: ${relative}`);
}

fs.rmSync(catalogRoot, { recursive: true, force: true });
console.log(`Removed local catalogue cache after verified sync: ${catalogRoot}`);
