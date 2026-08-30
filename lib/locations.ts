import business from "@/content/settings/business.json";
import { resolveMediaUrl } from "@/lib/media";

export const locations = business.locations.map((location) => ({
  ...location,
  image: resolveMediaUrl(location.image),
}));

export function getLocationImage(id: string) {
  const location = locations.find((candidate) => candidate.id === id);
  if (!location) throw new Error(`Unknown location: ${id}`);
  return location.image;
}
