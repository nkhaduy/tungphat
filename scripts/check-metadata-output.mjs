import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  indexableMetadataRoutes,
  noindexMetadataRoutes,
} from "./lib/metadata-route-policy.mjs";

const siteUrl = "https://mdftungphat.com";
const errors = [];

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? match[3],
    ]),
  );
}

function metadataTags(html) {
  const tags = [...html.matchAll(/<(?:link|meta)\b[^>]*>/gi)].map((match) =>
    attributes(match[0]),
  );
  return {
    canonicals: tags.filter((tag) => tag.rel?.toLowerCase() === "canonical"),
    robots: tags.filter((tag) => tag.name?.toLowerCase() === "robots"),
    openGraphUrls: tags.filter(
      (tag) => tag.property?.toLowerCase() === "og:url",
    ),
  };
}

for (const route of [...indexableMetadataRoutes, ...noindexMetadataRoutes]) {
  const outputPath = path.join("out", route, "index.html");
  if (!existsSync(outputPath)) {
    errors.push(`${route}: thiếu HTML export`);
    continue;
  }

  const expectedUrl = `${siteUrl}${route}`;
  const { canonicals, robots, openGraphUrls } = metadataTags(
    readFileSync(outputPath, "utf8"),
  );
  if (canonicals.length !== 1 || canonicals[0]?.href !== expectedUrl) {
    errors.push(
      `${route}: canonical phải xuất hiện đúng một lần và bằng ${expectedUrl}`,
    );
  }
  if (openGraphUrls.length !== 1 || openGraphUrls[0]?.content !== expectedUrl) {
    errors.push(
      `${route}: og:url phải xuất hiện đúng một lần và bằng ${expectedUrl}`,
    );
  }

  const robotsContent = robots[0]?.content.toLowerCase() ?? "";
  const expectedDirective = noindexMetadataRoutes.includes(route)
    ? "noindex"
    : "index";
  if (
    robots.length !== 1 ||
    !robotsContent.split(/\s*,\s*/).includes(expectedDirective) ||
    !robotsContent.split(/\s*,\s*/).includes("follow")
  ) {
    errors.push(`${route}: robots phải là ${expectedDirective}, follow`);
  }
}

const sitemapPath = path.join("out", "sitemap.xml");
if (!existsSync(sitemapPath)) {
  errors.push("Thiếu out/sitemap.xml");
} else {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  for (const route of indexableMetadataRoutes) {
    if (!sitemapUrls.includes(`${siteUrl}${route}`)) {
      errors.push(
        `${route}: URL indexable phải có trong sitemap với trailing slash`,
      );
    }
  }
  for (const route of noindexMetadataRoutes) {
    const normalizedRoute = route.replace(/\/$/, "");
    if (
      sitemapUrls.some(
        (url) => url.replace(/\/$/, "") === `${siteUrl}${normalizedRoute}`,
      )
    ) {
      errors.push(`${route}: URL noindex không được có trong sitemap`);
    }
  }
}

if (errors.length) {
  console.error(
    `Metadata output validation thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`,
  );
  process.exit(1);
}

console.log(
  `Metadata output validation pass: ${indexableMetadataRoutes.length + noindexMetadataRoutes.length} URL có canonical, og:url, robots và sitemap đúng.`,
);
