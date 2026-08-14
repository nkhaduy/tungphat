import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { MediaManifestEntry } from "./core";

const execFileAsync = promisify(execFile);
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

type RemoteObject = { sha256: string; bytes: number };
type SyncOptions = {
  entries: MediaManifestEntry[];
  head: (key: string) => Promise<RemoteObject | null>;
  upload: (entry: MediaManifestEntry, metadata: { contentType: string; cacheControl: string }) => Promise<void>;
  concurrency?: number;
};

export async function syncManifestEntries(options: SyncOptions) {
  const queue = [...options.entries];
  const result = { checked: options.entries.length, skipped: 0, uploaded: 0, failed: 0 };
  const workers = Array.from({ length: Math.max(1, options.concurrency ?? 4) }, async () => {
    for (;;) {
      const entry = queue.shift();
      if (!entry) return;
      try {
        const remote = await options.head(entry.objectKey);
        if (remote?.sha256 === entry.sha256 && remote.bytes === entry.bytes) {
          result.skipped += 1;
          continue;
        }
        await options.upload(entry, { contentType: entry.mimeType, cacheControl: IMMUTABLE_CACHE_CONTROL });
        result.uploaded += 1;
      } catch {
        result.failed += 1;
      }
    }
  });
  await Promise.all(workers);
  return result;
}

export async function wranglerUpload(bucket: string, entry: MediaManifestEntry): Promise<void> {
  await execFileAsync("node_modules/.bin/wrangler", [
    "r2", "object", "put", `${bucket}/${entry.objectKey}`,
    "--remote", "--file", entry.sourcePath, "--content-type", entry.mimeType,
    "--cache-control", IMMUTABLE_CACHE_CONTROL,
  ], { maxBuffer: 1024 * 1024 });
}
