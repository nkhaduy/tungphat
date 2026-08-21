import crypto from "node:crypto";
import sharp from "sharp";

export type ImageDuplicateClassification =
  | "EXACT_BINARY_DUPLICATE"
  | "VISUAL_DUPLICATE"
  | "NOT_DUPLICATE"
  | "AMBIGUOUS";

export type ImageComparison = {
  classification: ImageDuplicateClassification;
  reason: string;
  normalizedPixelSimilarity: number;
  dimensions: Array<{ width: number; height: number }>;
};

export function normalizeMediaReference(value: string): string {
  const decoded = decodeURIComponent(value.trim());
  const pathname = decoded.startsWith("http://") || decoded.startsWith("https://")
    ? new URL(decoded).pathname
    : decoded.split(/[?#]/, 1)[0];
  return pathname.replace(/^\/+/, "").replace(/^media\//, "");
}

export async function classifyImageBuffers(left: Buffer, right: Buffer): Promise<ImageComparison> {
  const [leftMeta, rightMeta] = await Promise.all([sharp(left).metadata(), sharp(right).metadata()]);
  if (!leftMeta.width || !leftMeta.height || !rightMeta.width || !rightMeta.height) {
    return { classification: "AMBIGUOUS", reason: "missing-dimensions", normalizedPixelSimilarity: 0, dimensions: [] };
  }
  const dimensions = [
    { width: leftMeta.width, height: leftMeta.height },
    { width: rightMeta.width, height: rightMeta.height },
  ];
  if (crypto.createHash("sha256").update(left).digest("hex") === crypto.createHash("sha256").update(right).digest("hex")) {
    return { classification: "EXACT_BINARY_DUPLICATE", reason: "same-sha256", normalizedPixelSimilarity: 1, dimensions };
  }
  const leftRatio = leftMeta.width / leftMeta.height;
  const rightRatio = rightMeta.width / rightMeta.height;
  if (Math.abs(leftRatio - rightRatio) / Math.max(leftRatio, rightRatio) > 0.015) {
    return { classification: "NOT_DUPLICATE", reason: "aspect-ratio-mismatch", normalizedPixelSimilarity: 0, dimensions };
  }
  const [leftPixels, rightPixels] = await Promise.all([
    normalizedPixels(left),
    normalizedPixels(right),
  ]);
  let difference = 0;
  for (let index = 0; index < leftPixels.length; index += 1) {
    difference += Math.abs(leftPixels[index] - rightPixels[index]);
  }
  const normalizedPixelSimilarity = 1 - difference / (leftPixels.length * 255);
  if (normalizedPixelSimilarity >= 0.975) {
    return { classification: "VISUAL_DUPLICATE", reason: "normalized-pixels-match", normalizedPixelSimilarity, dimensions };
  }
  if (normalizedPixelSimilarity >= 0.94) {
    return { classification: "AMBIGUOUS", reason: "near-visual-match", normalizedPixelSimilarity, dimensions };
  }
  return { classification: "NOT_DUPLICATE", reason: "visual-content-differs", normalizedPixelSimilarity, dimensions };
}

async function normalizedPixels(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(64, 64, { fit: "fill", kernel: "lanczos3" })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer();
}
