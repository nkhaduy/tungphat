export type BaThanhDetailMediaRole = "swatch" | "application" | "actual-photo";

export type BaThanhDetailMedia = {
  sourceUrl: string;
  role: BaThanhDetailMediaRole;
};

type SelectBaThanhDetailMediaInput = {
  codeNormalized: string;
  materialType: "melamine" | "laminate";
  sourceImageUrl?: string;
  detailImageUrls?: string[];
};

const LAMINATE_WAY_ALIASES: Record<string, string[]> = {
  P1010: ["SC013MW"], P1150: ["SC015MW"], P2001: ["SC014MW"], P2002: ["SC016MW"],
  P2052: ["SC017MW"], P2061: ["SC018MW"], P2660: ["SC013M"], P3190: ["SC012MW"],
  P4600: ["SC015M"], P4640: ["SC016M"], P7700: ["SC009MW"], P7740: ["SC010MW"],
  P7790: ["SC017M"], P9120: ["SC011MW"], P9340: ["SC018M"], P9660: ["SC014M"],
  S4600: ["BTS9"], S7382: ["BTS8"], S7402: ["BT164"], S7403: ["BT165"],
  W0304: ["BT162"], W0502: ["BT163"], W0504: ["BT161"], W5220: ["BT158"],
  W7020: ["BT166"], W7393: ["BT167"], W7412: ["BT159"], W9630: ["BT160"],
  F0022: ["BT117"], F3292: ["BT118"], F3293: ["BT52"], F3294: ["BT146"], F3295: ["BT90"],
};

function compact(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function filename(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  } catch {
    return "";
  }
}

function visibleCodes(url: string): string[] {
  const name = filename(url).toUpperCase().replace(/\.[A-Z0-9]+$/, "");
  return [...name.matchAll(/(?:BTSC|SC|BTS|BT)[-_ ]?\d{1,4}(?:[-_ ]?(?:MW|EV|DL|M|G|N))?(?=$|[^A-Z0-9])|(?:W|P|S|F)[-_ ]?\d{4}(?=$|[^A-Z0-9])/g)]
    .map((match) => compact(match[0] ?? ""));
}

function namedCodeMatches(code: string, url: string): boolean {
  const name = compact(filename(url));
  const aliases = new Set([compact(code), compact(code.replace(/^BT/, ""))]);
  if (code === "BTXANHBIEN") aliases.add("XANHDUONG");
  if (code === "BTXANHCHUOI") aliases.add("XANHCHUOI");
  if (code === "BTXANHCOBAN") aliases.add("XANHCOBAN");
  return [...aliases].some((alias) => alias.length > 1 && name.includes(alias));
}

function matchesCode(code: string, url: string, materialType: "melamine" | "laminate"): boolean {
  const expected = compact(code);
  const candidates = visibleCodes(url);
  if (materialType === "laminate" && LAMINATE_WAY_ALIASES[code]?.some((alias) => candidates.includes(alias))) return true;
  if (/\d/.test(expected)) {
    if (candidates.includes(expected)) return true;
    if (code.startsWith("SC") && candidates.includes(`${expected}M`)) return true;
    if (code.startsWith("BTS") && candidates.includes(`BT${expected.slice(2)}`)) return true;
    return false;
  }
  return namedCodeMatches(code, url);
}

function isBrandedOrPlaceholder(url: string): boolean {
  const name = filename(url);
  return /(?:logo|icon|background|cropped-|soon(?:-|\.)|tao-tem|tem-web|ba-thanh[-_ ](?:group|logo)|melamine[-_ ]ba[-_ ]thanh[-_ ](?:group|logo))/i.test(name)
    || /(?:BT-103(?:-|\.)|BT103(?:-|\.))/i.test(name);
}

function roleFor(url: string): BaThanhDetailMediaRole {
  if (/(?:MAU[-_ ]THUC[-_ ]TE|THUC[-_ ]TE|REAL|ACTUAL)/i.test(filename(url))) return "actual-photo";
  if (/(?:[-_](?:01|02)(?:[-_.]|$)|APP|APPLICATION|THIET[-_ ]KE|DESIGN)/i.test(filename(url))) return "application";
  return "swatch";
}

export function selectBaThanhDetailMedia(input: SelectBaThanhDetailMediaInput): BaThanhDetailMedia[] {
  const selected: BaThanhDetailMedia[] = [];
  const trustedPageCodes = new Set(visibleCodes(input.sourceImageUrl ?? ""));
  for (const sourceUrl of [...new Set(input.detailImageUrls ?? [])]) {
    if (!sourceUrl) continue;
    if (isBrandedOrPlaceholder(sourceUrl) && !matchesCode(input.codeNormalized, sourceUrl, input.materialType)) continue;
    const role = roleFor(sourceUrl);
    const printedCodes = visibleCodes(sourceUrl);
    const matchesTrustedPageCode = printedCodes.some((code) => trustedPageCodes.has(code));
    const isPageApplication = role !== "swatch";
    if (!matchesCode(input.codeNormalized, sourceUrl, input.materialType)
      && !(input.materialType === "laminate" && (matchesTrustedPageCode || isPageApplication))) continue;
    selected.push({ sourceUrl, role });
  }
  return selected;
}
