import { normalizeSupplierCode } from "@/lib/catalog/normalize-code";
import { isAllowedBaThanhUrl } from "@/lib/catalog/source-security";
import type { CatalogCategory } from "@/lib/catalog/types";

export type DiscoveredSourceItem = {
  sourceUrl: string;
  sourceImageUrl: string;
  category: string;
  sourceCategoryLabel: string;
  codeRaw: string;
  width?: number;
  height?: number;
};

export type BaThanhIndexResult = {
  categories: CatalogCategory[];
  items: DiscoveredSourceItem[];
};

export function reconcileBaThanhCode(indexCodeRaw: string, verifiedCodeRaw: string) {
  const normalized = normalizeSupplierCode(verifiedCodeRaw || indexCodeRaw);
  return {
    indexCodeRaw,
    codeRaw: verifiedCodeRaw || indexCodeRaw,
    codeNormalized: normalized.normalized,
    displayName: normalized.display,
    slug: normalized.slug,
    confident: normalized.confident,
  };
}

const KNOWN_CATEGORY_SLUGS: Record<string, string> = {
  "MAU VAN GO": "van-go",
  "MAU DON SAC": "don-sac",
  "MAU VAN DA": "van-da",
  "MAU VAN VAI": "van-vai",
};

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, digits: string) => String.fromCodePoint(Number.parseInt(digits, 16)))
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&agrave;/g, "à")
    .replace(/&Agrave;/g, "À");
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function asciiFold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase();
}

function slugifyLabel(value: string) {
  return asciiFold(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function attribute(attributes: string, name: string) {
  const match = attributes.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function sourceCode(url: string, imageUrl: string) {
  const routeBasename = decodeURIComponent(url.split("/").pop() || "").toUpperCase();
  const wayRoute = routeBasename.match(/^WAY-([WPSF]\d{4})$/);
  if (wayRoute) return wayRoute[1];
  const candidates = [imageUrl, url];
  for (const candidate of candidates) {
    const basename = decodeURIComponent(candidate.split("/").pop() || "")
      .replace(/\.[a-z0-9]+(?:\?.*)?$/i, "")
      .toUpperCase();
    const matches = [...basename.matchAll(/(?:^|[^A-Z0-9])((?:BTSC|SC|BTS|BT|MT|S|W|P|F)[-_ ]?\d{1,4}[A-Z]{0,4})(?=$|[^A-Z0-9])/g)];
    if (matches[0]?.[1]) return matches[0][1].replace(/[-_ ]/g, "");
    const withoutDescriptor = basename
      .replace(/^(?:ML-)/, "")
      .replace(/-(?:SOLID-COLOR|WOOD-GRAINS?|STONE).*$/, "");
    if (/^BT-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(withoutDescriptor)) return withoutDescriptor;
  }
  return "";
}

function detailCodeMatchesExpected(expected: string, verified: string) {
  if (expected === verified) return true;
  if (/^SC\d+$/.test(expected) && new RegExp(`^${expected}(?:M|MW|G)$`).test(verified)) return true;
  if (/^S\d+$/.test(expected) && new RegExp(`^BT${expected}G?$`).test(verified)) return true;
  const legacySolid = expected.match(/^BTSC(\d+)$/);
  if (legacySolid && new RegExp(`^SC${legacySolid[1]}(?:M|MW)$`).test(verified)) return true;
  const stoneWithSuffix = expected.match(/^S(\d+)G$/);
  if (stoneWithSuffix && verified === `BTS${stoneWithSuffix[1]}G`) return true;
  return false;
}

export function extractBaThanhIndex(html: string, indexUrl: string): BaThanhIndexResult {
  const tabMatches = [...html.matchAll(/<a\b[^>]*href=["']#([^"']+)["'][^>]*>[\s\S]*?<span\b[^>]*class=["'][^"']*vc_tta-title-text[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/a>/gi)];
  const categoryMap = new Map<string, { id: string; sourceLabel: string; slug: string }>();
  for (const match of tabMatches) {
    const sourceLabel = stripTags(match[2]);
    const category = {
      id: match[1],
      sourceLabel,
      slug: KNOWN_CATEGORY_SLUGS[asciiFold(sourceLabel)] || slugifyLabel(sourceLabel),
    };
    if (!categoryMap.has(category.id)) categoryMap.set(category.id, category);
  }
  const categories = [...categoryMap.values()];
  const items: DiscoveredSourceItem[] = [];

  categories.forEach((category, index) => {
    const startPattern = new RegExp(`<div\\b[^>]*class=["'][^"']*vc_tta-panel[^"']*["'][^>]*id=["']${category.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "i");
    const startMatch = startPattern.exec(html);
    if (!startMatch) return;
    const start = startMatch.index;
    const nextId = categories[index + 1]?.id;
    const nextPattern = nextId
      ? new RegExp(`<div\\b[^>]*class=["'][^"']*vc_tta-panel[^"']*["'][^>]*id=["']${nextId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "i")
      : null;
    const remaining = html.slice(start + startMatch[0].length);
    const nextMatch = nextPattern?.exec(remaining);
    const block = nextMatch ? remaining.slice(0, nextMatch.index) : remaining;

    for (const match of block.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const imageMatch = match[2].match(/<img\b([^>]*)>/i);
      if (!imageMatch) continue;
      const href = attribute(match[1], "href");
      const src = attribute(imageMatch[1], "src");
      if (!href || !src) continue;
      const sourceUrl = new URL(href, indexUrl);
      const sourceImageUrl = new URL(src, indexUrl);
      if (!isAllowedBaThanhUrl(sourceUrl.toString()) || !isAllowedBaThanhUrl(sourceImageUrl.toString())) continue;
      const codeRaw = sourceCode(sourceUrl.toString(), sourceImageUrl.toString());
      if (!codeRaw) continue;
      items.push({
        sourceUrl: sourceUrl.toString(),
        sourceImageUrl: sourceImageUrl.toString(),
        category: category.slug,
        sourceCategoryLabel: category.sourceLabel,
        codeRaw,
        width: Number(attribute(imageMatch[1], "width")) || undefined,
        height: Number(attribute(imageMatch[1], "height")) || undefined,
      });
    }
  });

  return {
    categories: categories.map(({ slug, sourceLabel }) => ({ slug, sourceLabel })),
    items,
  };
}

export function recognizeBaThanhDetail(
  html: string,
  input: { expectedCode: string; sourceUrl: string },
) {
  const footerIndex = html.search(/<footer\b|<div\b[^>]*id=["']footer["']/i);
  const page = footerIndex >= 0 ? html.slice(0, footerIndex) : html;
  const mainMatch = page.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const content = mainMatch?.[1] || page;
  const headingMatch = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(content);
  const detailContent = headingMatch ? content.slice(headingMatch.index) : content;
  const heading = stripTags(headingMatch?.[1] || "");
  const expected = normalizeSupplierCode(input.expectedCode).normalized;
  const headingText = heading.toUpperCase();
  const headingCodes = [
    ...headingText.matchAll(/\bSC[-_ ]?\d{1,4}[-_ ]?[A-Z]{0,4}\b/g),
    ...headingText.matchAll(/\bBT[-_ ]?S[-_ ]?\d{1,4}[A-Z]{0,4}\b/g),
    ...headingText.matchAll(/\bBT[-_ ]?[A-Z]\d{1,4}\b/g),
    ...headingText.matchAll(/\bBT[-_ ]?\d{1,4}[A-Z]{0,4}\b/g),
    ...headingText.matchAll(/\b(?:W|P|S|F)[-_ ]?\d{4}\b/g),
  ].map((match) => normalizeSupplierCode(match[0]).normalized);
  const materialText = asciiFold(`${heading} ${stripTags(detailContent).slice(0, 800)}`);
  const isMelamine = /MELAMINE|WOOD\s*GRAINS?|SOLID\s*COLOR|STONE|VAN\s*(?:GO|DA|VAI)|DON\s*SAC/i.test(materialText);
  const isLaminate = /LAMINATE\W+WAY|HINH ANH MAU LAMINATE/i.test(materialText);
  const headingAscii = asciiFold(heading);
  const headingCompact = headingAscii.replace(/[^A-Z0-9]/g, "");
  const namedExpected = !/\d/.test(expected);
  const expectedName = expected.replace(/^BT/, "");
  const namedAliases: Record<string, string[]> = { BTXANHBIEN: ["XANHDUONG"] };
  const namedMatch = namedExpected && isMelamine && [expectedName, ...(namedAliases[expected] || [])]
    .some((candidate) => candidate.length > 1 && headingCompact.includes(candidate));
  const verifiedCodeRaw = headingCodes[0] || (namedMatch ? input.expectedCode : "");
  const verified = verifiedCodeRaw ? normalizeSupplierCode(verifiedCodeRaw).normalized : "";
  const images = [...detailContent.matchAll(/<img\b([^>]*)>/gi)]
    .map((match) => attribute(match[1], "src"))
    .filter(Boolean)
    .map((src) => new URL(src, input.sourceUrl).toString())
    .filter((src) => new URL(src).hostname === "bathanh.com.vn")
    .filter((src) => !/(?:logo|icon|background|cropped-)/i.test(src));

  return {
    accepted: Boolean(heading && verifiedCodeRaw && (isMelamine || isLaminate) && (namedMatch || detailCodeMatchesExpected(expected, verified))),
    verifiedCodeRaw,
    heading,
    text: stripTags(detailContent),
    images: [...new Set(images)],
  };
}
