export type SitemapProductAlias = {
  url: string;
  canonicalUrl: string;
  locale: "vi" | "en" | "unknown";
  sourceId: string;
};

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseSitemapLocations(xml: string): string[] {
  return [...new Set(
    [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
      .map((match) => decodeXml(match[1].trim()))
      .filter(Boolean),
  )];
}

export function parseRobotsSitemapLocations(robots: string): string[] {
  return [...new Set(
    robots.split(/\r?\n/)
      .map((line) => line.match(/^\s*Sitemap\s*:\s*(\S+)/i)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(decodeXml),
  )];
}

function numericSourceId(url: string): string | undefined {
  try {
    return new URL(url).pathname.match(/\/(\d+)(?:-en)?\.html$/i)?.[1];
  } catch {
    return undefined;
  }
}

function localeFor(url: string): SitemapProductAlias["locale"] {
  const pathname = new URL(url).pathname;
  if (/-en\.html$/i.test(pathname) || /(?:^|\/)en(?:\/|$)/i.test(pathname)) return "en";
  return "vi";
}

export function selectCanonicalProductUrls(urls: string[]): {
  canonicalProductUrls: string[];
  aliases: SitemapProductAlias[];
  nonNumericProductUrls: string[];
} {
  const bySourceId = new Map<string, string[]>();
  const nonNumericProductUrls: string[] = [];
  for (const url of [...new Set(urls)]) {
    const sourceId = numericSourceId(url);
    if (!sourceId) {
      nonNumericProductUrls.push(url);
      continue;
    }
    const group = bySourceId.get(sourceId) ?? [];
    group.push(url);
    bySourceId.set(sourceId, group);
  }
  const aliases: SitemapProductAlias[] = [];
  const canonicalProductUrls: string[] = [];
  for (const [sourceId, group] of bySourceId) {
    const sorted = [...group].sort((left, right) => {
      const localeDifference = Number(localeFor(left) === "en") - Number(localeFor(right) === "en");
      return localeDifference || left.localeCompare(right);
    });
    const canonicalUrl = sorted[0];
    canonicalProductUrls.push(canonicalUrl);
    aliases.push(...sorted.map((url) => ({ url, canonicalUrl, locale: localeFor(url), sourceId })));
  }
  return {
    canonicalProductUrls: canonicalProductUrls.sort(),
    aliases: aliases.sort((left, right) => left.url.localeCompare(right.url)),
    nonNumericProductUrls: [...new Set(nonNumericProductUrls)].sort(),
  };
}
