export type HtmlSignals = {
  title: string;
  description: string;
  robots: string;
  canonical: string;
  h1: string;
  directAnswer: boolean;
  schemaCount: number;
  schemaErrors: number;
  internalLinks: string[];
  indexable: boolean;
};

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`, "iu"));
  return match?.[1] ?? match?.[2] ?? "";
}

function textContent(value: string) {
  return value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
}

export function parseHtmlSignals(html: string, headers: Record<string, string> = {}): HtmlSignals {
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/giu)].map((match) => match[0]);
  const descriptionTag = metaTags.find((tag) => attribute(tag, "name").toLowerCase() === "description");
  const robotsTag = metaTags.find((tag) => attribute(tag, "name").toLowerCase() === "robots");
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/giu)].map((match) => match[0]).find((tag) => attribute(tag, "rel").toLowerCase() === "canonical");
  const xRobots = Object.entries(headers).find(([key]) => key.toLowerCase() === "x-robots-tag")?.[1] ?? "";
  const robots = attribute(robotsTag ?? "", "content") || xRobots;
  const schemaSources = [...html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu)].map((match) => match[1]);
  let schemaErrors = 0;
  schemaSources.forEach((source) => {
    try { JSON.parse(source); } catch { schemaErrors += 1; }
  });
  const internalLinks = [...html.matchAll(/<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')/giu)]
    .map((match) => match[1] ?? match[2] ?? "")
    .filter((href) => href.startsWith("/") && !href.startsWith("//") && !href.startsWith("#") && !/\.(?:json|png|jpe?g|webp|svg|pdf|xml|txt)$/iu.test(href));
  return {
    title: textContent(html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1] ?? ""),
    description: attribute(descriptionTag ?? "", "content"),
    robots,
    canonical: attribute(canonicalTag ?? "", "href"),
    h1: textContent(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/iu)?.[1] ?? ""),
    directAnswer: /data-answer-block/iu.test(html),
    schemaCount: schemaSources.length,
    schemaErrors,
    internalLinks,
    indexable: !robots.split(/[,\s]+/u).some((token) => token.toLowerCase() === "noindex"),
  };
}
