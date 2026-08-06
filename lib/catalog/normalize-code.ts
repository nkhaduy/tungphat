export type NormalizedCodeResult = {
  raw: string;
  normalized: string;
  display: string;
  slug: string;
  confident: boolean;
};

const BRAND_PREFIX = /^\s*(?:ba\s*thanh)\s*/i;

export function normalizeSupplierCode(raw: string): NormalizedCodeResult {
  const cleaned = raw
    .replace(BRAND_PREFIX, "")
    .trim()
    .toUpperCase()
    .replace(/[–—_]+/g, "-")
    .replace(/\s+/g, " ");
  const btAlphaNumeric = cleaned.match(/^BT[- ]+([A-Z]\d{1,4})$/);
  if (btAlphaNumeric) {
    return {
      raw,
      normalized: `BT${btAlphaNumeric[1]}`,
      display: `BT ${btAlphaNumeric[1]}`,
      slug: `bt-${btAlphaNumeric[1].toLowerCase()}`,
      confident: true,
    };
  }
  const compact = cleaned.replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]{1,4})(\d{1,4})([A-Z]*)$/);

  if (!match) {
    const fallback = compact || "UNKNOWN";
    const named = cleaned.match(/^([A-Z]{1,4})[- ]+([A-Z0-9]+(?:[- ]+[A-Z0-9]+)*)$/);
    if (named) {
      const display = `${named[1]} ${named[2].replace(/[- ]+/g, " ")}`;
      return {
        raw,
        normalized: fallback,
        display,
        slug: display.toLowerCase().replace(/\s+/g, "-"),
        confident: false,
      };
    }
    return {
      raw,
      normalized: fallback,
      display: fallback,
      slug: fallback.toLowerCase(),
      confident: false,
    };
  }

  const [, prefix, digits, suffix] = match;
  const display = `${prefix} ${digits}${suffix}`;
  return {
    raw,
    normalized: `${prefix}${digits}${suffix}`,
    display,
    slug: `${prefix.toLowerCase()}-${digits}${suffix.toLowerCase()}`,
    confident: suffix.length <= 1 || suffix === "MW",
  };
}
