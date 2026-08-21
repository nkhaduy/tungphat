export type GalleryImage = {
  role: string;
  sourceUrl: string;
  localPath?: string;
  thumbnailSrc?: string;
  [key: string]: unknown;
};

export type ConfirmedDuplicate = {
  duplicateIndex: number;
  canonicalIndex: number;
};

export function compactConfirmedGalleryDuplicates<T extends GalleryImage>(
  images: T[],
  duplicates: ConfirmedDuplicate[],
): Array<T & { thumbnailSrc?: string }> {
  if (!duplicates.length) return images;
  const removed = new Set(duplicates.map((duplicate) => duplicate.duplicateIndex));
  const thumbnailByCanonical = new Map<number, string>();
  for (const duplicate of duplicates) {
    const duplicateImage = images[duplicate.duplicateIndex];
    const canonicalImage = images[duplicate.canonicalIndex];
    const preview = duplicateImage?.role === "swatch" && canonicalImage?.role !== "swatch"
      ? duplicateImage.localPath
      : undefined;
    if (preview && !thumbnailByCanonical.has(duplicate.canonicalIndex)) {
      thumbnailByCanonical.set(duplicate.canonicalIndex, preview);
    }
  }
  return images.flatMap((image, index) => {
    if (removed.has(index)) return [];
    const thumbnailSrc = thumbnailByCanonical.get(index);
    return [{ ...image, ...(thumbnailSrc ? { thumbnailSrc } : {}) }];
  });
}
