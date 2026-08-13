import type { PublicSupplierColorCode, SupplierColorImage } from "../../lib/catalog/color-codes/types";
import type { ColorMediaDiscoveryArtifact, ColorMediaDiscoveryEntry, ColorMediaLocalAsset } from "./color-media";

function mediaFromAsset(asset: ColorMediaLocalAsset): SupplierColorImage {
  return {
    role: asset.role,
    sourceUrl: asset.sourceUrl,
    localPath: asset.localPath,
    checksum: asset.checksum,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    rightsStatus: "UNCONFIRMED",
  };
}

function mediaFromDiscovery(entry: ColorMediaDiscoveryEntry): SupplierColorImage[] {
  if (entry.localAssets?.length) return entry.localAssets.map(mediaFromAsset);
  if (!entry.previewSourceUrl || !entry.localPath) return [];
  return [mediaFromAsset({
    role: "swatch",
    sourceUrl: entry.previewSourceUrl,
    localPath: entry.localPath,
    checksum: entry.checksum,
    mimeType: entry.mimeType,
    width: entry.width,
    height: entry.height,
  })];
}

function mergeRecordMedia(
  record: PublicSupplierColorCode,
  entry: ColorMediaDiscoveryEntry,
): PublicSupplierColorCode {
  if (entry.reasonCode === "INVALID_IMAGE") {
    return {
      ...record,
      images: record.images.filter((image) => image.role !== "swatch"),
    };
  }
  const discovered = mediaFromDiscovery(entry);
  if (!discovered.length) return record;
  const images = [...record.images];
  for (const media of discovered) {
    const existingIndex = images.findIndex(
      (image) => image.sourceUrl === media.sourceUrl || (media.role === "swatch" && image.role === "swatch"),
    );
    if (existingIndex >= 0) images[existingIndex] = { ...images[existingIndex], ...media };
    else images.push(media);
  }
  images.sort((left, right) => ["swatch", "fullsheet", "actual-photo", "product", "application"].indexOf(left.role) - ["swatch", "fullsheet", "actual-photo", "product", "application"].indexOf(right.role));
  return { ...record, images };
}

export function applyColorMediaToIndex(
  records: PublicSupplierColorCode[],
  artifacts: ColorMediaDiscoveryArtifact[],
): PublicSupplierColorCode[] {
  const byId = new Map(
    artifacts.flatMap((artifact) => artifact.entries).map((entry) => [entry.id, entry]),
  );
  const bySource = new Map(
    artifacts
      .flatMap((artifact) => artifact.entries.map((entry) => [`${artifact.supplier}:${entry.sourceUrl}`, entry] as const)),
  );
  return records.map((record) => {
    const entry = byId.get(record.id) ?? bySource.get(`${record.supplier}:${record.sourceUrl}`);
    return entry ? mergeRecordMedia(record, entry) : record;
  });
}
