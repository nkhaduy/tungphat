import { resolveMediaUrl } from "@/lib/media";

type EditorialImageVariant = "featured" | "thumbnail";

const verifiedVariants: Record<string, Record<EditorialImageVariant, string>> = {
  "cnc-service.webp": {
    featured: "/images/editorial/cnc-service.webp",
    thumbnail: "/images/editorial/cnc-service-480.webp",
  },
  "wood-panels.webp": {
    featured: "/images/editorial/wood-panels.webp",
    thumbnail: "/images/editorial/wood-panels-480.webp",
  },
  "vanchongam.webp": {
    featured: "/images/editorial/vanchongam.webp",
    thumbnail: "/images/editorial/vanchongam-480.webp",
  },
};

/** Use local WebP derivatives only when their source media was verified in-repo. */
export function resolveEditorialMedia(reference: string, variant: EditorialImageVariant) {
  const resolved = resolveMediaUrl(reference);
  const filename = new URL(resolved, "https://editorial-media.invalid").pathname.split("/").pop() ?? "";
  return verifiedVariants[filename]?.[variant] ?? resolved;
}
