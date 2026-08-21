import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dryRun = JSON.parse(fs.readFileSync(path.join(root, "r2-cleanup-dry-run.json"), "utf8")) as {
  exactDuplicates: Array<{ objects: string[]; activeReferences: string[]; signature: string }>;
};
const inventory = JSON.parse(fs.readFileSync(process.env.R2_INVENTORY || "/tmp/tungphat-r2-media-inventory-after-an-cuong.json", "utf8")) as {
  objects: Array<{ key: string; etag: string; size: number; httpMetadata?: { contentType?: string } }>;
};
const byKey = new Map(inventory.objects.map((object) => [object.key, object]));
const manifest = dryRun.exactDuplicates.flatMap((group) => {
  if (!group.objects.every((key) => key.startsWith("supplier/")) || group.activeReferences.length !== 1) return [];
  const canonicalKey = group.activeReferences[0];
  return group.objects.filter((key) => key !== canonicalKey).map((duplicateKey) => {
    const object = byKey.get(duplicateKey);
    if (!object) throw new Error(`Missing exact duplicate object ${duplicateKey}`);
    return {
      duplicateKey,
      canonicalKey,
      etag: object.etag,
      size: object.size,
      mime: object.httpMetadata?.contentType,
      reason: `exact-size-etag:${group.signature}`,
      referencesChecked: ["Payload media", "supplier artifacts", "frontend/source/SEO/runtime"],
      activeConsumersAfterRepoint: 0,
      action: "DELETE_EXACT_DUPLICATE",
    };
  });
}).sort((left, right) => left.duplicateKey.localeCompare(right.duplicateKey));
fs.writeFileSync(path.join(root, "r2-delete-safety-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ objects: manifest.length, bytes: manifest.reduce((sum, item) => sum + item.size, 0) }, null, 2));
