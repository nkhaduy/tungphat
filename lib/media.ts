export type MediaReference = string;

const HTTPS_URL = /^https:\/\//i;

/**
 * Single resolution point for media URLs. Content currently stores public/
 * paths in Git. A future R2 adapter only needs to change this module and the
 * content schema instead of every page/component.
 */
export function mediaUrl(reference: MediaReference) {
  const value = reference.trim();
  if (value.startsWith("/") || HTTPS_URL.test(value)) return value;
  throw new Error(`Media reference must be a public path or HTTPS URL: ${value}`);
}

export function absoluteMediaUrl(reference: MediaReference, siteUrl: string) {
  return new URL(mediaUrl(reference), siteUrl).toString();
}
