import fs from "node:fs";
import path from "node:path";

type AuditOptions = { rootDir: string; siteUrl: string; expectedDirectAnswerRoutes?: string[] };

function walkHtmlFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walkHtmlFiles(absolute) : entry.isFile() && entry.name.endsWith(".html") ? [absolute] : [];
  });
}

function routeForFile(rootDir: string, file: string) {
  const relative = path.relative(rootDir, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"/index.html".length)}/`;
  return `/${relative}`;
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`, "iu"))?.[1] ?? tag.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`, "iu"))?.[2] ?? "";
}

function normalizeRoute(value: string) {
  const url = new URL(value, "https://example.com");
  const pathname = url.pathname.replace(/\/+/gu, "/");
  return pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/gu, "")}/`;
}

function duplicateGroupCount(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.values()].filter((count) => count > 1).length;
}

function canonicalMatchesRoute(value: string, siteUrl: string, route: string) {
  try {
    const canonical = new URL(value);
    const expectedOrigin = new URL(siteUrl).origin;
    const hasCanonicalSlash = canonical.pathname === "/" || canonical.pathname.endsWith("/");
    return canonical.origin === expectedOrigin && !canonical.username && !canonical.password && hasCanonicalSlash && !canonical.search && !canonical.hash && normalizeRoute(canonical.pathname) === route;
  } catch {
    return false;
  }
}

function aiCrawlerBlockerCount(rootDir: string) {
  const robotsPath = path.join(rootDir, "robots.txt");
  if (!fs.existsSync(robotsPath)) return 1;
  const robots = fs.readFileSync(robotsPath, "utf8");
  const searchAgents = new Set(["*", "bingbot", "googlebot", "googlebot-smartphone", "oai-searchbot", "gptbot", "chatgpt-user", "perplexitybot", "claudebot", "google-extended", "applebot"]);
  const sections = [...robots.matchAll(/^\s*user-agent:\s*([^\r\n]+)[\r\n]+([\s\S]*?)(?=^\s*user-agent:|\s*$)/gimu)];
  const blocksAll = sections.some((match) => searchAgents.has(match[1].trim().toLowerCase()) && /^\s*disallow:\s*\/\s*$/imu.test(match[2]));
  const hasSitemap = /^\s*sitemap:\s*https:\/\//imu.test(robots);
  return Number(blocksAll) + Number(!hasSitemap);
}

export function auditStaticOutput({ rootDir, siteUrl, expectedDirectAnswerRoutes = [] }: AuditOptions) {
  const files = walkHtmlFiles(rootDir).filter((file) => !["/404/", "/404.html"].includes(routeForFile(rootDir, file)));
  const pages = files.map((file) => {
    const html = fs.readFileSync(file, "utf8");
    const route = routeForFile(rootDir, file);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1]?.replace(/\s+/gu, " ").trim() ?? "";
    const descriptionTag = [...html.matchAll(/<meta\b[^>]*>/giu)].map((match) => match[0]).find((tag) => attribute(tag, "name").toLowerCase() === "description");
    const robotsTag = [...html.matchAll(/<meta\b[^>]*>/giu)].map((match) => match[0]).find((tag) => attribute(tag, "name").toLowerCase() === "robots");
    const canonicalTags = [...html.matchAll(/<link\b[^>]*>/giu)].map((match) => match[0]).filter((tag) => attribute(tag, "rel").toLowerCase() === "canonical");
    const description = descriptionTag ? attribute(descriptionTag, "content") : "";
    const robots = robotsTag ? attribute(robotsTag, "content").toLowerCase() : "";
    const indexable = !robots.split(/[,\s]+/u).includes("noindex");
    const schemaSources = [...html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu)].map((match) => match[1]);
    let schemaErrors = 0;
    schemaSources.forEach((source) => {
      try { JSON.parse(source); } catch { schemaErrors += 1; }
    });
    const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/iu)?.[1] ?? html;
    const visibleText = body.replace(/<script\b[\s\S]*?<\/script>/giu, " ").replace(/<style\b[\s\S]*?<\/style>/giu, " ").replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
    const internalLinks = [...html.matchAll(/<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')/giu)].map((match) => match[1] ?? match[2]).filter((href) => href && href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/") && !/\.(?:json|png|jpe?g|webp|svg|pdf|xml|txt)$/iu.test(href));
    return { route, title, description, robots, canonical: canonicalTags.length === 1 ? attribute(canonicalTags[0], "href") : "", canonicalCount: canonicalTags.length, indexable, schemaSources, schemaErrors, visibleText, internalLinks, directAnswer: /data-answer-block/iu.test(html) };
  });
  const routeSet = new Set(pages.map((page) => page.route));
  const sitemapPath = path.join(rootDir, "sitemap.xml");
  const sitemapXml = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu)].map((match) => match[1]);
  const sitemapRoutes = sitemapUrls.map(normalizeRoute);
  const sitemapRouteSet = new Set(sitemapRoutes);
  const invalidSitemapUrls = sitemapUrls.filter((url, index) => !canonicalMatchesRoute(url, siteUrl, sitemapRoutes[index])).length;
  const duplicateSitemapUrls = sitemapUrls.length - new Set(sitemapUrls).size;
  const inbound = new Map<string, number>([...routeSet].map((route) => [route, 0]));
  pages.forEach((page) => page.internalLinks.forEach((href) => { const route = normalizeRoute(href); if (inbound.has(route)) inbound.set(route, (inbound.get(route) ?? 0) + 1); }));
  const indexablePages = pages.filter((page) => page.indexable);
  const sitemapErrors = sitemapRoutes.filter((route) => !routeSet.has(route) || pages.find((page) => page.route === route)?.indexable === false).length
    + indexablePages.filter((page) => !sitemapRouteSet.has(page.route)).length
    + invalidSitemapUrls
    + duplicateSitemapUrls
    + (sitemapXml ? 0 : 1);
  const brokenLinks = pages.flatMap((page) => page.internalLinks.map((href) => ({ page, route: normalizeRoute(href) }))).filter(({ route }) => !routeSet.has(route)).length;
  const invalidCanonicals = indexablePages.filter((page) => page.canonicalCount !== 1 || !canonicalMatchesRoute(page.canonical, siteUrl, page.route)).length;
  const missingDirectAnswerRoutes = expectedDirectAnswerRoutes.map(normalizeRoute).filter((route) => !pages.find((page) => page.route === route && page.indexable && page.directAnswer));
  return {
    totalHtmlPages: pages.length,
    indexableUrls: indexablePages.length,
    noindexUrls: pages.length - indexablePages.length,
    invalidCanonicals,
    duplicateTitles: duplicateGroupCount(indexablePages.map((page) => page.title)),
    duplicateDescriptions: duplicateGroupCount(indexablePages.map((page) => page.description)),
    brokenLinks,
    schemaErrors: pages.reduce((sum, page) => sum + page.schemaErrors, 0),
    pagesWithStructuredData: indexablePages.filter((page) => page.schemaSources.length > 0).length,
    pagesWithDirectAnswerBlocks: indexablePages.filter((page) => page.directAnswer).length,
    orphanPages: indexablePages.filter((page) => page.route !== "/" && (inbound.get(page.route) ?? 0) === 0).length,
    thinIndexablePages: indexablePages.filter((page) => page.visibleText.length < 200).length,
    sitemapErrors,
    aiCrawlerBlockers: aiCrawlerBlockerCount(rootDir),
    missingDirectAnswerRoutes,
  };
}
