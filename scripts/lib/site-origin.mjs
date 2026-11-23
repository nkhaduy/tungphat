const LEGACY_SITE_ORIGIN = "https://mdftungphat.com";
const CURRENT_SITE_ORIGIN = "https://gotungphat.com";

export function releaseSiteOrigin(env = process.env) {
  const value = env.NEXT_PUBLIC_SITE_ORIGIN || env.SEO_SITE_URL || LEGACY_SITE_ORIGIN;
  if (value !== LEGACY_SITE_ORIGIN && value !== CURRENT_SITE_ORIGIN) {
    throw new Error("Site origin must match an approved release origin.");
  }
  return value;
}
