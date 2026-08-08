export type InternalLinkPage = { url: string; html: string };
type LinkType = "contextual" | "navigation" | "breadcrumb";

function normalizeInternalUrl(value: string) {
  if (!value || value.startsWith("#") || /^(mailto:|tel:|javascript:)/iu.test(value)) return null;
  try {
    const url = new URL(value, "https://mdftungphat.com");
    if (url.hostname !== "mdftungphat.com") return null;
    const path = url.pathname === "/" ? "/" : `${url.pathname.replace(/\/+$/u, "")}/`;
    return path;
  } catch {
    return null;
  }
}

function textContent(value: string) {
  return value.replace(/<[^>]+>/gu, " ").replace(/&[^;]+;/gu, " ").replace(/\s+/gu, " ").trim();
}

function extractLinks(html: string, type: LinkType) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/giu)].map((match) => ({
    target: normalizeInternalUrl(match[1]),
    anchor: textContent(match[2]),
    type,
  })).filter((link): link is { target: string; anchor: string; type: LinkType } => Boolean(link.target));
}

function pageLinks(html: string) {
  const classified: Array<{ target: string; anchor: string; type: LinkType }> = [];
  const consumed = new Set<string>();
  const regions = [
    { type: "breadcrumb" as const, regex: /<(nav|ol)\b[^>]*(?:breadcrumb|Breadcrumb)[^>]*>[\s\S]*?<\/\1>/giu },
    { type: "navigation" as const, regex: /<(nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/giu },
  ];
  for (const region of regions) {
    for (const match of html.matchAll(region.regex)) {
      consumed.add(match[0]);
      classified.push(...extractLinks(match[0], region.type));
    }
  }
  let remainder = html;
  for (const region of consumed) remainder = remainder.replace(region, "");
  classified.push(...extractLinks(remainder, "contextual"));
  return classified;
}

export function analyzeInternalLinkGraph(pages: InternalLinkPage[]) {
  const known = new Set(pages.map((page) => page.url));
  const outgoing = new Map<string, ReturnType<typeof pageLinks>>();
  for (const page of pages) outgoing.set(page.url, pageLinks(page.html).filter((link) => known.has(link.target)));

  const depth = new Map<string, number>([["/", 0]]);
  const queue = ["/"];
  while (queue.length) {
    const source = queue.shift()!;
    for (const link of outgoing.get(source) ?? []) {
      if (!depth.has(link.target)) {
        depth.set(link.target, (depth.get(source) ?? 0) + 1);
        queue.push(link.target);
      }
    }
  }

  const byUrl: Record<string, { clickDepth: number | null; internalInlinks: number; contextualInlinks: number; navigationInlinks: number; breadcrumbInlinks: number; anchorVariation: string[] }> = {};
  for (const page of pages) {
    const incoming = [...outgoing.entries()].flatMap(([source, links]) => links.filter((link) => link.target === page.url).map((link) => ({ ...link, source })));
    byUrl[page.url] = {
      clickDepth: depth.get(page.url) ?? null,
      internalInlinks: incoming.length,
      contextualInlinks: incoming.filter((link) => link.type === "contextual").length,
      navigationInlinks: incoming.filter((link) => link.type === "navigation").length,
      breadcrumbInlinks: incoming.filter((link) => link.type === "breadcrumb").length,
      anchorVariation: [...new Set(incoming.map((link) => link.anchor).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")),
    };
  }
  return { pageCount: pages.length, byUrl };
}
