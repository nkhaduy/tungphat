import { absolutePageUrl } from "@/lib/seo";

export type PublicationState = {
  draft: boolean;
  noindex: boolean;
};

/** A CMS canonical override can designate another page as the preferred URL. */
export function hasSelfCanonical(entry: { canonical?: string }, path: string): boolean {
  return !entry.canonical || absolutePageUrl(entry.canonical) === absolutePageUrl(path);
}

export function filterPublishedContent<T extends PublicationState>(
  entries: readonly T[],
): T[] {
  return entries.filter(
    (entry) => entry.draft === false && entry.noindex === false,
  );
}

export function getListingIndexability(
  publishedCount: number,
  options: { hasStandaloneContent?: boolean } = {},
) {
  if (!Number.isInteger(publishedCount) || publishedCount < 0) {
    throw new Error("Published count must be a non-negative integer.");
  }

  const index = publishedCount > 0 || options.hasStandaloneContent === true;
  return {
    index,
    follow: true as const,
    includeInSitemap: index,
  };
}
