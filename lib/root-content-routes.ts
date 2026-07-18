import { isReservedRootSlug } from "@/lib/reserved-slugs";

export type RootContentCandidate = {
  slug: string;
  draft?: boolean;
  noindex?: boolean;
  collection: "products" | "pages";
  source?: string;
};

/** Published CMS content that must be rendered by app/[slug]. */
export function dynamicRootContentParams(entries: RootContentCandidate[]) {
  return entries
    .filter((entry) => !entry.draft && !entry.noindex)
    .filter((entry) => !isReservedRootSlug(entry.slug))
    .map((entry) => ({ slug: entry.slug }));
}

export function rootContentSlugCollisions(entries: RootContentCandidate[]) {
  const seen = new Map<string, RootContentCandidate>();
  const collisions: Array<[RootContentCandidate, RootContentCandidate]> = [];
  for (const entry of entries) {
    const previous = seen.get(entry.slug);
    if (previous) collisions.push([previous, entry]);
    else seen.set(entry.slug, entry);
  }
  return collisions;
}
