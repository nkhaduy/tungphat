const OLD_ORIGIN = "https://mdftungphat.com";
const NEW_ORIGIN = "https://gotungphat.com";

export function releaseOrigin(value: string | undefined): string {
  if (!value) return OLD_ORIGIN;
  if (value === OLD_ORIGIN || value === NEW_ORIGIN) return value;
  throw new Error("Unapproved release site origin");
}

export function mapLegacySiteUrl(value: string, origin: string): string {
  if (origin !== NEW_ORIGIN) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && ["mdftungphat.com", "www.mdftungphat.com"].includes(url.hostname) && !url.username && !url.password) {
      url.host = "gotungphat.com";
      return url.toString();
    }
  } catch {
    // Relative URLs and non-URL values are resolved by their existing callers.
  }
  return value;
}
