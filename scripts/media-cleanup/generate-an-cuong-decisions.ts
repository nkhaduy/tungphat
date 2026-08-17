import fs from "node:fs";
import path from "node:path";

type AuditImage = {
  sourceUrl?: string;
  originalChecksum?: string;
  originalPath?: string;
  originalWidth?: number;
  originalHeight?: number;
  originalBytes?: number;
};

type AuditRecord = {
  id: string;
  code: string;
  images?: AuditImage[];
  image12?: {
    classification: string;
    reason: string;
    similarity: number;
    canonicalIndex?: number;
  };
  error?: string;
};

type GeneratedDecision = {
  recordId: string;
  code: string;
  duplicateIndex: number;
  canonicalIndex: number;
  duplicateChecksum: string;
  canonicalChecksum: string;
  duplicateSourceUrl: string;
  canonicalSourceUrl: string;
  duplicatePath: string;
  canonicalPath: string;
  duplicateDimensions: Array<number | undefined>;
  canonicalDimensions: Array<number | undefined>;
  duplicateBytes?: number;
  canonicalBytes?: number;
  classification: "VISUAL_DUPLICATE";
  reason: string;
  similarity: number;
};

const auditPath = process.argv[2];
if (!auditPath) throw new Error("Usage: tsx generate-an-cuong-decisions.ts <audit.json>");

const root = process.cwd();
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8")) as { records: AuditRecord[] };
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/supplier-color-codes.json"), "utf8")) as {
  records: Array<{ id: string; codeRaw: string; images: AuditImage[] }>;
};
const existingDecisionPath = path.join(root, "data/catalogs/an-cuong-gallery-dedup.json");
const existingDecisions = fs.existsSync(existingDecisionPath)
  ? JSON.parse(fs.readFileSync(existingDecisionPath, "utf8")) as { decisions: Array<Record<string, unknown>> }
  : { decisions: [] };
const existingById = new Map(existingDecisions.decisions.map((decision) => [String(decision.recordId), decision]));

const manuallyConfirmed = new Map([
  ["an-cuong:VENEERM04VHT54", {
    reason: "normalized-pixels-match",
    similarity: 0.9987084482230392,
    canonicalIndex: 1,
    duplicateSourceUrl: "https://ancuong.com/products/products-thumb/30300587900702417000.jpg",
    canonicalSourceUrl: "https://ancuong.com/products/products-full/30300587900702417000.jpg",
    duplicateChecksum: "8c0020dce60cdc4084535176625533df2b9bad324a113fb798f71a82293eedba",
    canonicalChecksum: "d603874d8b17502257ce2c69e0bb54fcc49ed2eafdd173fe5c2bd4a0fb826f09",
    duplicatePath: "/media/supplier/an-cuong/veneerm04vht54/swatch/8c0020dce60cdc4084535176625533df2b9bad324a113fb798f71a82293eedba.jpg",
    canonicalPath: "/media/supplier/an-cuong/veneerm04vht54/board/d603874d8b17502257ce2c69e0bb54fcc49ed2eafdd173fe5c2bd4a0fb826f09.jpg",
    duplicateDimensions: [1000, 497],
    canonicalDimensions: [6000, 2983],
    duplicateBytes: 99251,
    canonicalBytes: 10892170,
  }],
]);
const catalogueById = new Map(catalogue.records.map((record) => [record.id, record]));
const decisions = audit.records.flatMap<GeneratedDecision>((record) => {
  const evidence = record.image12?.classification === "VISUAL_DUPLICATE"
    ? record.image12
    : manuallyConfirmed.get(record.id);
  if (!evidence || evidence.canonicalIndex === undefined) return [];
  const current = catalogueById.get(record.id);
  if ("duplicateChecksum" in evidence) {
    return [{ recordId: record.id, code: record.code || current?.codeRaw || record.id, duplicateIndex: 0, classification: "VISUAL_DUPLICATE" as const, ...evidence }];
  }
  let images = record.images?.length ? record.images : current?.images;
  const previous = existingById.get(record.id);
  if ((!images?.[0]?.originalChecksum || !images[1]?.originalChecksum) && previous) {
    const previousDuplicateDimensions = Array.isArray(previous.duplicateDimensions) ? previous.duplicateDimensions : [];
    const previousCanonicalDimensions = Array.isArray(previous.canonicalDimensions) ? previous.canonicalDimensions : [];
    images = [0, 1].map((index) => {
      const duplicate = Number(previous.duplicateIndex) === index;
      const dimensions = duplicate ? previousDuplicateDimensions : previousCanonicalDimensions;
      return {
        originalChecksum: String(duplicate ? previous.duplicateChecksum : previous.canonicalChecksum),
        originalPath: String(duplicate ? previous.duplicatePath : previous.canonicalPath),
        originalWidth: Number(dimensions[0]),
        originalHeight: Number(dimensions[1]),
        originalBytes: Number(duplicate ? previous.duplicateBytes : previous.canonicalBytes),
        sourceUrl: String(duplicate ? previous.duplicateSourceUrl || "" : previous.canonicalSourceUrl || ""),
      };
    });
  }
  if (!current || !images?.[0]?.originalChecksum || !images[1]?.originalChecksum) {
    throw new Error(`Missing original media evidence for ${record.id}`);
  }
  const canonicalIndex = evidence.canonicalIndex;
  const duplicateIndex = canonicalIndex === 0 ? 1 : 0;
  return [{
    recordId: record.id,
    code: record.code || current.codeRaw,
    duplicateIndex,
    canonicalIndex,
    duplicateChecksum: images[duplicateIndex].originalChecksum!,
    canonicalChecksum: images[canonicalIndex].originalChecksum!,
    duplicateSourceUrl: String(images[duplicateIndex].sourceUrl || (evidence as { duplicateSourceUrl?: string }).duplicateSourceUrl),
    canonicalSourceUrl: String(images[canonicalIndex].sourceUrl || (evidence as { canonicalSourceUrl?: string }).canonicalSourceUrl),
    duplicatePath: String(images[duplicateIndex].originalPath),
    canonicalPath: String(images[canonicalIndex].originalPath),
    duplicateDimensions: [images[duplicateIndex].originalWidth, images[duplicateIndex].originalHeight],
    canonicalDimensions: [images[canonicalIndex].originalWidth, images[canonicalIndex].originalHeight],
    duplicateBytes: images[duplicateIndex].originalBytes,
    canonicalBytes: images[canonicalIndex].originalBytes,
    classification: "VISUAL_DUPLICATE" as const,
    reason: evidence.reason,
    similarity: evidence.similarity,
  }];
}).sort((left, right) => left.recordId.localeCompare(right.recordId));

const output = {
  schemaVersion: 1,
  auditSource: path.basename(auditPath),
  totalConfirmed: decisions.length,
  canonicalImage1: decisions.filter((decision) => decision.canonicalIndex === 0).length,
  canonicalImage2: decisions.filter((decision) => decision.canonicalIndex === 1).length,
  decisions,
};
const target = path.join(root, "data/catalogs/an-cuong-gallery-dedup.json");
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ target, totalConfirmed: output.totalConfirmed, canonicalImage1: output.canonicalImage1, canonicalImage2: output.canonicalImage2 }, null, 2));
