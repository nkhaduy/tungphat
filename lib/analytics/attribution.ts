export type Attribution = {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
};

const GOOGLE_HOST = /(^|\.)google\.[a-z.]+$/i;
const FACEBOOK_HOST = /(^|\.)((facebook|fb|instagram)\.com|l\.facebook\.com)$/i;
const ZALO_HOST = /(^|\.)zalo\.(me|com)$/i;

function clean(value: string | null, max = 120) {
  return value?.trim().toLowerCase().slice(0, max) || undefined;
}

export function attributionFromUrl(url: URL, referrerHost = ""): Attribution {
  const source = clean(url.searchParams.get("utm_source"));
  const medium = clean(url.searchParams.get("utm_medium"));
  if (source || medium) {
    return {
      source: source || "campaign",
      medium: medium || "campaign",
      campaign: clean(url.searchParams.get("utm_campaign")),
      term: clean(url.searchParams.get("utm_term")),
      content: clean(url.searchParams.get("utm_content")),
    };
  }
  if (url.searchParams.has("gclid")) return { source: "google", medium: "cpc" };
  if (url.searchParams.has("fbclid")) return { source: "facebook", medium: "social" };

  const host = referrerHost.toLowerCase().replace(/^www\./, "");
  if (!host) return { source: "direct", medium: "none" };
  if (GOOGLE_HOST.test(host)) return { source: "google", medium: "organic" };
  if (FACEBOOK_HOST.test(host)) return { source: "facebook", medium: "social" };
  if (ZALO_HOST.test(host)) return { source: "zalo", medium: "social" };
  if (host.includes("google.") && (host.includes("maps") || host === "maps.app.goo.gl")) {
    return { source: "google_maps", medium: "referral" };
  }
  if (host === "mdftungphat.com" || host.endsWith(".mdftungphat.com")) {
    return { source: "direct", medium: "none" };
  }
  return { source: host.slice(0, 120), medium: "referral" };
}

export function attributionParameters(url: URL, referrer: string) {
  let referrerHost = "";
  try { referrerHost = new URL(referrer).hostname; } catch { /* no referrer */ }
  const allowed = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;
  const result: Record<string, string> = {};
  for (const key of allowed) {
    const value = url.searchParams.get(key)?.trim();
    if (value) result[key] = value.slice(0, key.endsWith("clid") ? 180 : 120);
  }
  if (referrerHost) result.referrer_host = referrerHost.slice(0, 255);
  return result;
}
