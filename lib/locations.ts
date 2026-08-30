import business from "@/content/settings/business.json";
import { resolveMediaUrl } from "@/lib/media";

export const locations = business.locations.map((location) => ({
  ...location,
  image: resolveMediaUrl(location.image),
}));
