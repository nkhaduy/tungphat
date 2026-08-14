export type MediaReference = string;

const HTTPS_URL = /^https:\/\//i;

/**
 * Single resolution point for media URLs. Content currently stores public/
 * paths in Git. A future R2 adapter only needs to change this module and the
 * content schema instead of every page/component.
 */
export function mediaUrl(reference: MediaReference, mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL) {
  const value = reference.trim();
  if (HTTPS_URL.test(value)) return value;
  if (value.startsWith("/")) {
    if (mediaBaseUrl && value.startsWith("/catalog/")) {
      if (!HTTPS_URL.test(mediaBaseUrl)) throw new Error(`Media base URL must use HTTPS: ${mediaBaseUrl}`);
      return new URL(value.slice(1), `${mediaBaseUrl.replace(/\/$/u, "")}/`).toString();
    }
    return value;
  }
  throw new Error(`Media reference must be a public path or HTTPS URL: ${value}`);
}

export function absoluteMediaUrl(reference: MediaReference, siteUrl: string) {
  return new URL(mediaUrl(reference), siteUrl).toString();
}
