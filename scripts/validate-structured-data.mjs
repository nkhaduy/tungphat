import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve(process.env.SEO_OUTPUT_DIR ?? "out");
const siteOrigin = new URL(process.env.SEO_SITE_URL ?? "https://mdftungphat.com").origin;
const pageTypes = new Map([
  ["/cat-cnc-go/", "Service"],
  ["/gia-cong-cnc-mdf/", "Service"],
  ["/gia-cong-cnc/", "Service"],
  ["/go-ghep-cao-su/", "Product"],
  ["/go-ghep-tram/", "Product"],
  ["/mdf-chong-am/", "Product"],
  ["/van-mdf/", "Product"],
  ["/go-ghep/", "CollectionPage"],
  ["/van-go-cong-nghiep/", "CollectionPage"],
]);
const forbiddenKeys = new Set(["offer", "offers", "price", "pricecurrency", "availability", "review", "aggregaterating"]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : entry.isFile() && entry.name === "index.html" ? [file] : [];
  });
}

function routeForFile(file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join("/");
  return relative === "index.html" ? "/" : `/${relative.slice(0, -"/index.html".length)}/`;
}

function inspect(value, route, types, urls, errors, seenIds) {
  if (Array.isArray(value)) return value.forEach((item) => inspect(item, route, types, urls, errors, seenIds));
  if (!value || typeof value !== "object") return;
  if (typeof value["@type"] === "string") types.push(value["@type"]);
  if (typeof value["@type"] === "string" && typeof value["@id"] === "string" && value["@id"].startsWith(siteOrigin)) {
    if (seenIds.has(value["@id"]) && !value["@id"].includes("#organization") && !value["@id"].includes("#website")) errors.push(`${route}: duplicate @id ${value["@id"]}`);
    seenIds.add(value["@id"]);
  }
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key.toLowerCase())) errors.push(`${route}: forbidden schema key ${key}`);
    if ((key === "url" || key === "@id" || key === "item") && typeof child === "string" && child.startsWith(siteOrigin)) {
      try {
        const url = new URL(child);
        if (!url.search && !url.pathname.includes(".") && url.pathname !== "/" && !url.pathname.endsWith("/")) errors.push(`${route}: schema page URL missing trailing slash ${child}`);
        urls.push(child);
      } catch { errors.push(`${route}: malformed schema URL ${child}`); }
    }
    inspect(child, route, types, urls, errors, seenIds);
  }
}

const errors = [];
for (const file of walk(outputDirectory)) {
  const route = routeForFile(file);
  const html = fs.readFileSync(file, "utf8");
  const blocks = [...html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu)];
  const types = [];
  const urls = [];
  const seenIds = new Set();
  for (const block of blocks) {
    try { inspect(JSON.parse(block[1]), route, types, urls, errors, seenIds); } catch { errors.push(`${route}: invalid JSON-LD`); }
  }
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/iu)?.[1] ?? "";
  if (!canonical && !route.startsWith("/cms-preview")) errors.push(`${route}: missing canonical`);
  if (pageTypes.has(route) && !types.includes(pageTypes.get(route))) errors.push(`${route}: missing ${pageTypes.get(route)} schema`);
  if (route !== "/404/" && route !== "/404.html" && !html.match(/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/iu) && blocks.length === 0) errors.push(`${route}: indexable page has no structured data`);
}

if (errors.length) {
  console.error("Structured data validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Structured data validation pass: ${walk(outputDirectory).length} HTML documents.`);
