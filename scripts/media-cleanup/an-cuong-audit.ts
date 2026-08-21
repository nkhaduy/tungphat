import fs from "node:fs";
import path from "node:path";
import { classifyImageBuffers, normalizeMediaReference } from "./image-compare";
import { selectCanonicalMedia } from "./canonical";

type ImageRecord = {
  role: string;
  sourceUrl: string;
  localPath?: string;
  originalUrl?: string;
  originalPath?: string;
  originalChecksum?: string;
  originalWidth?: number;
  originalHeight?: number;
  originalBytes?: number;
};

type ColorRecord = {
  id: string;
  codeRaw: string;
  slug: string;
  supplier: string;
  materialType: string;
  images: ImageRecord[];
};

type PairAudit = {
  left: number;
  right: number;
  classification: string;
  reason: string;
  similarity: number;
  canonicalIndex?: number;
};

async function main() {
  const root = process.cwd();
  const input = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/supplier-color-codes.json"), "utf8")) as { records: ColorRecord[] };
  const records = input.records.filter((record) => record.supplier === "an-cuong");
  const outputPath = process.env.AN_CUONG_AUDIT_OUTPUT || path.join(root, "reports", "an-cuong-gallery-audit.json");
  const results: Array<Record<string, unknown>> = new Array(records.length);
  let next = 0;
  let completed = 0;
  const workerCount = Math.max(1, Number(process.env.AN_CUONG_AUDIT_CONCURRENCY || 12));

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (next < records.length) {
      const index = next++;
      const record = records[index];
      try {
        results[index] = await auditRecord(record);
      } catch (error) {
        results[index] = { id: record.id, code: record.codeRaw, slug: record.slug, error: error instanceof Error ? error.message : String(error) };
      }
      completed += 1;
      process.stderr.write(`\rAudited ${completed}/${records.length} An Cuong galleries`);
    }
  }));

  const pair12 = results.map((result) => result.image12 as PairAudit | undefined).filter(Boolean) as PairAudit[];
  const allPairs = results.flatMap((result) => (result.pairs as PairAudit[] | undefined) || []);
  const summary = {
    totalCodes: records.length,
    codesWithAtLeast2Images: records.filter((record) => record.images.length >= 2).length,
    image12: counts(pair12),
    fullGallery: counts(allPairs),
    errors: results.filter((result) => result.error).length,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, records: results }, null, 2)}\n`);
  process.stderr.write("\n");
  console.log(JSON.stringify({ outputPath, summary }, null, 2));
}

async function auditRecord(record: ColorRecord) {
  const buffers = await Promise.all(record.images.map((image) => image.localPath ? fetchPreview(image) : Promise.resolve(undefined)));
  const pairs: PairAudit[] = [];
  for (let left = 0; left < record.images.length; left += 1) {
    for (let right = left + 1; right < record.images.length; right += 1) {
      if (!buffers[left] || !buffers[right]) continue;
      pairs.push(await auditPair(record.images, buffers as Buffer[], left, right));
    }
  }
  return {
    id: record.id,
    code: record.codeRaw,
    slug: record.slug,
    materialType: record.materialType,
    images: record.images,
    image12: pairs.find((pair) => pair.left === 0 && pair.right === 1),
    pairs,
  };
}

async function fetchPreview(image: ImageRecord): Promise<Buffer> {
  if (!image.localPath) throw new Error(`Missing localPath for ${image.role}`);
  let failure = "unknown fetch failure";
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(new URL(`/media${image.localPath}`, "https://cms.mdftungphat.com"), {
        headers: { "accept-encoding": "identity", "user-agent": "TungPhatMediaAudit/1.0" },
      });
      if (!response.ok) throw new Error(`${response.status} ${image.localPath}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      await import("sharp").then(({ default: sharp }) => sharp(buffer).metadata());
      return buffer;
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  throw new Error(failure);
}

async function auditPair(images: ImageRecord[], buffers: Buffer[], left: number, right: number): Promise<PairAudit> {
  const leftImage = images[left];
  const rightImage = images[right];
  if (leftImage.originalPath && rightImage.originalPath && normalizeMediaReference(leftImage.originalPath) === normalizeMediaReference(rightImage.originalPath)) {
    return { left, right, classification: "EXACT_REFERENCE_DUPLICATE", reason: "same-r2-key", similarity: 1, canonicalIndex: canonicalIndex(images, left, right) };
  }
  if (leftImage.originalChecksum && leftImage.originalChecksum === rightImage.originalChecksum) {
    return { left, right, classification: "EXACT_BINARY_DUPLICATE", reason: "same-original-sha256", similarity: 1, canonicalIndex: canonicalIndex(images, left, right) };
  }
  const comparison = await classifyImageBuffers(buffers[left], buffers[right]);
  return {
    left,
    right,
    classification: comparison.classification,
    reason: comparison.reason,
    similarity: comparison.normalizedPixelSimilarity,
    ...(comparison.classification.includes("DUPLICATE") ? { canonicalIndex: canonicalIndex(images, left, right) } : {}),
  };
}

function canonicalIndex(images: ImageRecord[], left: number, right: number): number {
  const selected = selectCanonicalMedia([left, right].map((index) => ({
    id: String(index),
    width: images[index].originalWidth,
    height: images[index].originalHeight,
    bytes: images[index].originalBytes,
    role: images[index].role,
  })));
  return Number(selected.id);
}

function counts(pairs: PairAudit[]) {
  return Object.fromEntries([...new Set(pairs.map((pair) => pair.classification))].sort().map((classification) => [classification, pairs.filter((pair) => pair.classification === classification).length]));
}

void main();
