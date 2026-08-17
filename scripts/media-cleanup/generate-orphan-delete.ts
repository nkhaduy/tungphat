import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pass1Path = process.env.ORPHAN_PASS1;
if (!pass1Path) throw new Error("ORPHAN_PASS1 is required");
const pass1 = JSON.parse(fs.readFileSync(pass1Path, "utf8")) as { unknown: Array<{ key: string }> };
const pass2Path = path.join(root, "r2-cleanup-dry-run.json");
const pass2 = JSON.parse(fs.readFileSync(pass2Path, "utf8")) as Record<string, unknown> & {
  unknown: Array<{ key: string; size: number }>;
  objectsBefore: number;
  sizeBefore: number;
};
const inventory = JSON.parse(fs.readFileSync(process.env.R2_INVENTORY || "/tmp/tungphat-r2-media-inventory-after-exact.json", "utf8")) as {
  objects: Array<{ key: string; etag: string; size: number; httpMetadata?: { contentType?: string } }>;
};
const first = new Set(pass1.unknown.map((object) => object.key));
const byKey = new Map(inventory.objects.map((object) => [object.key, object]));
const verifiedOrphans = pass2.unknown.flatMap((candidate) => {
  if (!first.has(candidate.key) || !candidate.key.startsWith("catalog/ba-thanh/")) return [];
  const object = byKey.get(candidate.key);
  if (!object) throw new Error(`Missing orphan candidate ${candidate.key}`);
  return [{
    duplicateKey: candidate.key,
    canonicalKey: null,
    etag: object.etag,
    size: object.size,
    mime: object.httpMetadata?.contentType,
    reason: "zero Payload/frontend/SEO/supplier/runtime references in two passes",
    referencesChecked: ["Payload media", "catalog manifest", "supplier artifacts", "frontend/source/SEO/runtime"],
    activeConsumersAfterRepoint: 0,
    action: "DELETE_VERIFIED_ORPHAN",
  }];
}).sort((left, right) => left.duplicateKey.localeCompare(right.duplicateKey));
const orphanKeys = new Set(verifiedOrphans.map((object) => object.duplicateKey));
const saving = verifiedOrphans.reduce((sum, object) => sum + object.size, 0);
const updated = {
  ...pass2,
  verifiedOrphans,
  unknown: pass2.unknown.filter((object) => !orphanKeys.has(object.key)),
  projectedObjectsAfter: pass2.objectsBefore - verifiedOrphans.length,
  projectedSizeAfter: pass2.sizeBefore - saving,
  projectedSaving: saving,
};
fs.writeFileSync(pass2Path, `${JSON.stringify(updated, null, 2)}\n`);
fs.writeFileSync(path.join(root, "r2-delete-safety-manifest.json"), `${JSON.stringify(verifiedOrphans, null, 2)}\n`);
console.log(JSON.stringify({ objects: verifiedOrphans.length, bytes: saving, unknownKeep: updated.unknown.length }, null, 2));
