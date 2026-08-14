import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { MediaManifest } from "./core";
import { syncManifestEntries, wranglerUpload } from "./sync";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const bucket = process.env.MEDIA_R2_BUCKET ?? "tung-phat-media";
const manifestPath = path.join(root, "data/catalog-media-manifest.json");
const cacheDir = path.join(root, ".cache/media-sync");
const remoteManifestPath = path.join(cacheDir, "remote-manifest.json");

async function readRemoteManifest(): Promise<MediaManifest | null> {
  fs.mkdirSync(cacheDir, { recursive: true });
  try {
    await execFileAsync(path.join(root, "node_modules/.bin/wrangler"), ["r2", "object", "get", `${bucket}/catalog/_manifest.json`, "--remote", "--file", remoteManifestPath]);
    return JSON.parse(fs.readFileSync(remoteManifestPath, "utf8")) as MediaManifest;
  } catch {
    return null;
  }
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as MediaManifest;
  const startIndex = Number(process.env.MEDIA_SYNC_START_INDEX ?? 0);
  if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex > manifest.entries.length) throw new Error("MEDIA_SYNC_START_INDEX must be a valid manifest index");
  const remote = await readRemoteManifest();
  const remoteByKey = new Map(remote?.entries.map((entry) => [entry.objectKey, { sha256: entry.sha256, bytes: entry.bytes }]) ?? []);
  const result = await syncManifestEntries({
    entries: manifest.entries.slice(startIndex),
    head: async (key) => remoteByKey.get(key) ?? null,
    upload: async (entry) => wranglerUpload(bucket, entry),
    concurrency: Number(process.env.MEDIA_SYNC_CONCURRENCY ?? 12),
  });
  if (result.failed) throw new Error(`Media sync failed for ${result.failed} objects`);
  await execFileAsync(path.join(root, "node_modules/.bin/wrangler"), [
    "r2", "object", "put", `${bucket}/catalog/_manifest.json`, "--remote", "--file", manifestPath,
    "--content-type", "application/json", "--cache-control", "no-cache",
  ]);
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
