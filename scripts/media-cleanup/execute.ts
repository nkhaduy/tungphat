import fs from "node:fs";
import path from "node:path";
import type { DeleteExpectation } from "./r2-delete";

async function main() {
  const root = process.cwd();
  const endpoint = process.env.R2_DELETE_ENDPOINT || "http://127.0.0.1:8791/delete";
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "r2-delete-safety-manifest.json"), "utf8")) as Array<{
    duplicateKey?: string;
    etag?: string;
    size?: number;
    action?: string;
    activeConsumersAfterRepoint?: number;
  }>;
  const unique = new Map<string, DeleteExpectation>();
  for (const item of manifest) {
    if (!item.action?.startsWith("DELETE") || item.activeConsumersAfterRepoint !== 0) continue;
    if (!item.duplicateKey || !item.etag || !Number.isFinite(item.size)) throw new Error("Delete manifest is missing key, ETag, or size");
    unique.set(item.duplicateKey, { key: item.duplicateKey, etag: item.etag, size: Number(item.size) });
  }
  const objects = [...unique.values()].sort((left, right) => left.key.localeCompare(right.key));
  let deleted = 0;
  for (let index = 0; index < objects.length; index += 100) {
    const batch = objects.slice(index, index + 100);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(batch),
    });
    const result = await response.json() as { deleted?: number; error?: string };
    if (!response.ok || result.deleted !== batch.length) throw new Error(result.error || `Delete batch failed: ${response.status}`);
    deleted += result.deleted;
    process.stderr.write(`\rDeleted ${deleted}/${objects.length} verified duplicate objects`);
  }
  process.stderr.write("\n");
  console.log(JSON.stringify({ deleted, bytes: objects.reduce((sum, object) => sum + object.size, 0) }, null, 2));
}

void main();
