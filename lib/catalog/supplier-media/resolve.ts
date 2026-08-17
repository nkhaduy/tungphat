import type { MediaCandidateSet, ResolvedMediaCandidate, RetainedSupplierMedia } from "./types";

const CROP_PATTERN = /(?:-\d{2,4}x\d{2,4}(?=\.[a-z]+(?:$|\?))|\/(?:thumb|thumbnail|small|medium|resize|crop)\/|[?&](?:w|width|h|height|fit|crop|resize)=)/i;

function srcsetCandidates(srcset?: string): Array<{ url: string; width: number }> {
  if (!srcset) return [];
  return srcset.split(",").map((part) => {
    const match = part.trim().match(/^(\S+)\s+(\d+)w$/);
    return match ? { url: match[1], width: Number(match[2]) } : null;
  }).filter((item): item is { url: string; width: number } => Boolean(item));
}

export function resolveOriginalMedia(input: MediaCandidateSet): ResolvedMediaCandidate {
  const explicit: Array<[ResolvedMediaCandidate["selectionReason"], string | undefined]> = [
    ["lightbox", input.lightboxHref],
    ["data-full", input.dataFull],
    ["data-large", input.dataLarge],
    ["data-original", input.dataOriginal],
    ["zoom", input.dataZoomImage],
  ];
  const chosen = explicit.find(([, url]) => Boolean(url));
  if (chosen?.[1]) return { selectedUrl: chosen[1], suspectedCrop: CROP_PATTERN.test(chosen[1]), selectionReason: chosen[0] };

  const largest = srcsetCandidates(input.srcset).sort((left, right) => right.width - left.width)[0];
  if (largest) return { selectedUrl: largest.url, suspectedCrop: CROP_PATTERN.test(largest.url), selectionReason: "srcset" };
  if (!input.src) throw new Error("Media candidate has no usable URL");
  return { selectedUrl: input.src, suspectedCrop: CROP_PATTERN.test(input.src), selectionReason: "src" };
}

function quality(item: RetainedSupplierMedia): number {
  return item.width * item.height + (item.suspectedCrop ? 0 : Number.MAX_SAFE_INTEGER / 2);
}

export function dedupeSupplierMedia(items: RetainedSupplierMedia[]): RetainedSupplierMedia[] {
  const retained = new Map<string, RetainedSupplierMedia>();
  for (const item of items) {
    const existing = retained.get(item.checksum);
    if (!existing || quality(item) > quality(existing)) retained.set(item.checksum, item);
  }
  return [...retained.values()];
}

const TYPE_ORDER: Record<RetainedSupplierMedia["type"], number> = {
  texture: 0,
  swatch: 1,
  board: 2,
  detail: 3,
  edge: 4,
  room: 5,
  application: 6,
  other: 7,
};

export function selectPrimaryMedia(items: RetainedSupplierMedia[]) {
  const gallery = [...items].sort((left, right) => TYPE_ORDER[left.type] - TYPE_ORDER[right.type]);
  return { primary: gallery[0], gallery };
}

export function supplierOriginalKey(input: {
  supplier: string;
  code: string;
  type: RetainedSupplierMedia["type"];
  checksum: string;
  mimeType: string;
}) {
  const supplier = input.supplier.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const code = input.code.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const extensions: Record<string, string> = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[input.mimeType];
  if (!supplier || !code || !/^[a-f0-9]{64}$/.test(input.checksum) || !extension) {
    throw new Error("Unsafe supplier original media key input");
  }
  return `supplier/${supplier}/${code}/${input.type}/${input.checksum}.${extension}`;
}
