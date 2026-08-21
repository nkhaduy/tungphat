import fs from "node:fs";
import path from "node:path";
import { collectMediaKeys, normalizeR2Key } from "./reference-graph";

type InventoryObject = { key: string; size: number; etag: string; uploaded?: string; httpMetadata?: { contentType?: string } };

export function groupExactDuplicateObjects(objects: Array<Pick<InventoryObject, "key" | "size" | "etag">>) {
  const groups = new Map<string, Array<Pick<InventoryObject, "key" | "size" | "etag">>>();
  for (const object of objects) {
    const signature = `${object.size}:${object.etag.replaceAll('"', "")}`;
    const current = groups.get(signature) || [];
    current.push(object);
    groups.set(signature, current);
  }
  return [...groups.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([signature, matches]) => ({
      signature,
      objects: matches.map((object) => object.key).sort(),
      potentialSaving: matches[0].size * (matches.length - 1),
    }))
    .sort((left, right) => right.potentialSaving - left.potentialSaving);
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function repoSourceReferences(root: string): Set<string> {
  const references = new Set<string>();
  const roots = ["app", "components", "lib", "scripts", "payload-cms/src", "payload-cms/scripts"];
  const mediaPattern = /(?:https?:\/\/[^\s"'`)]*)?\/?media\/(?:catalog|supplier|uploads)\/[^\s"'`),}]+|\/(?:catalog)\/[^\s"'`),}]+/g;
  const visit = (entry: string) => {
    for (const child of fs.readdirSync(entry, { withFileTypes: true })) {
      const target = path.join(entry, child.name);
      if (child.isDirectory()) visit(target);
      else if (/\.(?:ts|tsx|js|mjs|css|md|json)$/i.test(child.name)) {
        const text = fs.readFileSync(target, "utf8");
        for (const match of text.matchAll(mediaPattern)) {
          const key = normalizeR2Key(match[0]);
          if (key) references.add(key);
        }
      }
    }
  };
  for (const relative of roots) {
    const entry = path.join(root, relative);
    if (fs.existsSync(entry)) visit(entry);
  }
  return references;
}

function main() {
  const root = process.cwd();
  const inventoryPath = process.env.R2_INVENTORY || "/tmp/tungphat-r2-media-inventory.json";
  const d1MediaPath = process.env.D1_MEDIA_EXPORT || "/tmp/tungphat-d1-media.json";
  const inventory = readJson(inventoryPath) as { generatedAt: string; totalObjects: number; totalBytes: number; objects: InventoryObject[] };
  const decisions = readJson(path.join(root, "data/catalogs/an-cuong-gallery-dedup.json")) as { decisions: Array<Record<string, unknown>> };
  const audit = readJson(process.env.AN_CUONG_AUDIT || "/tmp/an-cuong-gallery-audit-v3.json") as { records: Array<Record<string, unknown>> };
  const activeReferences = new Set<string>();
  for (const relative of [
    "data/catalogs/supplier-color-codes.json",
    "data/catalogs/supplier-search-index.json",
    "data/catalog-media-manifest.json",
  ]) {
    const file = path.join(root, relative);
    if (fs.existsSync(file)) collectMediaKeys(readJson(file), activeReferences);
  }
  if (fs.existsSync(d1MediaPath)) collectMediaKeys(readJson(d1MediaPath), activeReferences);
  for (const key of repoSourceReferences(root)) activeReferences.add(key);

  const inventoryByKey = new Map(inventory.objects.map((object) => [object.key, object]));
  const anCuongImage12Duplicates = decisions.decisions.map((decision) => {
    const duplicateKey = normalizeR2Key(String(decision.duplicatePath));
    const canonicalKey = normalizeR2Key(String(decision.canonicalPath));
    const duplicateObject = duplicateKey ? inventoryByKey.get(duplicateKey) : undefined;
    return {
      ...decision,
      duplicateKey,
      canonicalKey,
      etag: duplicateObject?.etag,
      size: duplicateObject?.size,
      mime: duplicateObject?.httpMetadata?.contentType,
      referencesChecked: ["supplier-color-codes", "supplier-search-index", "catalog-media-manifest", "Payload media", "frontend/source/SEO/runtime"],
      activeConsumersAfterRepoint: duplicateKey && activeReferences.has(duplicateKey) ? 1 : 0,
      action: duplicateKey && duplicateObject && !activeReferences.has(duplicateKey) ? "DELETE_AFTER_PRODUCTION_REPOINT_VERIFY" : "KEEP",
    };
  });
  const exactDuplicates = groupExactDuplicateObjects(inventory.objects).map((group) => ({
    ...group,
    action: group.objects.some((key) => !key.includes("/")) || group.objects.some((key) => key.startsWith("uploads/"))
      ? "KEEP_PUBLIC_URL_STABILITY"
      : "REVIEW_AND_REPOINT_BEFORE_DELETE",
    activeReferences: group.objects.filter((key) => activeReferences.has(key)),
  }));
  const visualDuplicates = audit.records
    .filter((record) => ["AMBIGUOUS", "NOT_DUPLICATE"].includes(String((record.image12 as { classification?: string } | undefined)?.classification)))
    .map((record) => ({ id: record.id, code: record.code, image12: record.image12, action: "KEEP" }));
  const confirmedDeleteKeys = new Set(anCuongImage12Duplicates.filter((item) => item.action.startsWith("DELETE")).map((item) => item.duplicateKey));
  const unknown = inventory.objects
    .filter((object) => !activeReferences.has(object.key) && !confirmedDeleteKeys.has(object.key))
    .map((object) => ({ key: object.key, size: object.size, classification: "UNKNOWN", action: "KEEP_PENDING_SECOND_PASS" }));
  const projectedSaving = [...confirmedDeleteKeys]
    .reduce((sum, key) => sum + Number(inventoryByKey.get(String(key))?.size || 0), 0);
  const report = {
    generatedAt: new Date().toISOString(),
    sourceInventoryGeneratedAt: inventory.generatedAt,
    objectsBefore: inventory.totalObjects,
    sizeBefore: inventory.totalBytes,
    anCuongImage12Duplicates,
    anCuongGalleryDuplicates: anCuongImage12Duplicates,
    exactDuplicates,
    visualDuplicates,
    verifiedOrphans: [],
    optimize: [],
    keep: visualDuplicates,
    unknown,
    projectedObjectsAfter: inventory.totalObjects - confirmedDeleteKeys.size,
    projectedSizeAfter: inventory.totalBytes - projectedSaving,
    projectedSaving,
  };
  fs.writeFileSync(path.join(root, "r2-cleanup-dry-run.json"), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "r2-delete-safety-manifest.json"), `${JSON.stringify(anCuongImage12Duplicates.filter((item) => item.action.startsWith("DELETE")), null, 2)}\n`);
  console.log(JSON.stringify({
    objectsBefore: report.objectsBefore,
    sizeBefore: report.sizeBefore,
    anCuongDuplicates: anCuongImage12Duplicates.length,
    deletionCandidates: confirmedDeleteKeys.size,
    exactDuplicateGroups: exactDuplicates.length,
    unknownKeep: unknown.length,
    projectedObjectsAfter: report.projectedObjectsAfter,
    projectedSizeAfter: report.projectedSizeAfter,
    projectedSaving,
  }, null, 2));
}

if (process.argv[1]?.endsWith("dry-run.ts")) main();
