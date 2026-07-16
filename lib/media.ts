export type MediaReference =
  | string
  | {
      key: string;
      alt?: string;
      name?: string;
      mimeType?: string;
      size?: number;
    };

const ABSOLUTE_URL = /^https:\/\//i;

export function isSafeMediaKey(key: string) {
  return (
    key.length > 0 &&
    key.length <= 512 &&
    !key.startsWith("/") &&
    !key.includes("\\") &&
    !key.split("/").includes("..") &&
    /^(?:images|videos|documents|catalogues|og)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(key)
  );
}

export function mediaKey(reference: MediaReference) {
  return typeof reference === "string" ? reference : reference.key;
}

export function mediaUrl(reference: MediaReference, baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL) {
  const value = mediaKey(reference).trim();
  if (value.startsWith("/")) return value;
  if (ABSOLUTE_URL.test(value)) return value;
  if (!isSafeMediaKey(value)) throw new Error(`Invalid media object key: ${value}`);
  if (!baseUrl?.trim()) throw new Error("NEXT_PUBLIC_MEDIA_BASE_URL is required for R2 media object keys");
  return `${baseUrl.replace(/\/+$/, "")}/${value}`;
}

export function absoluteMediaUrl(reference: MediaReference, siteUrl: string, baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL) {
  return new URL(mediaUrl(reference, baseUrl), siteUrl).toString();
}
