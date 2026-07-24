import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve("out");
const sitemapPath = path.join(outputDirectory, "sitemap.xml");
const canonicalOrigin = "https://mdftungphat.com";
const httpOrigin = process.env.SITEMAP_CHECK_ORIGIN;
const placeholderRoutes = new Set([
  "/catalogue/an-cuong/",
  "/catalogue/ba-thanh/",
  "/catalogue/thanh-thuy/",
  "/san-pham/an-cuong/",
  "/san-pham/ba-thanh/",
  "/san-pham/kes/",
  "/san-pham/thanh-thuy/",
]);
const utilityOrNotFoundRoutes = new Set([
  "/bao-gia/",
  "/cms-preview/",
  "/404/",
  "/_not-found/",
  "/bai-viet/__empty-collection/",
  "/du-an/__empty-collection/",
]);

if (!existsSync(sitemapPath)) {
  console.error("Thiếu out/sitemap.xml. Hãy chạy npm run build trước khi kiểm tra sitemap.");
  process.exit(1);
}

const errors = [];
const sitemap = readFileSync(sitemapPath, "utf8");
const urlEntries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g)];

if (!/^<\?xml\s+version="1\.0"\s+encoding="UTF-8"\?>\s*<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">[\s\S]*<\/urlset>\s*$/u.test(sitemap)) {
  errors.push("Sitemap XML không đúng cấu trúc urlset chuẩn.");
}

const urls = urlEntries.map((entry) => entry[1]);
if (!urls.length || urls.length !== [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].length) {
  errors.push("Sitemap XML không parse được đầy đủ các phần tử <url><loc>.");
}

function outputPathFor(pathname) {
  const route = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "");
  return route ? path.join(outputDirectory, route, "index.html") : path.join(outputDirectory, "index.html");
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? match[3],
    ]),
  );
}

function pageMetadata(html) {
  const tags = [...html.matchAll(/<(?:link|meta)\b[^>]*>/gi)].map((match) => attributes(match[0]));
  return {
    canonicals: tags.filter((tag) => tag.rel?.toLowerCase() === "canonical"),
    robots: tags.filter((tag) => tag.name?.toLowerCase() === "robots"),
  };
}

const seenUrls = new Set();
for (const url of urls) {
  let parsed;
  try { parsed = new URL(url); } catch { errors.push(`URL sitemap không hợp lệ: ${url}`); continue; }
  if (seenUrls.has(url)) errors.push(`Sitemap chứa URL trùng: ${url}`);
  seenUrls.add(url);
  if (parsed.protocol !== "https:") errors.push(`Sitemap phải dùng HTTPS: ${url}`);
  if (parsed.hostname === "www.mdftungphat.com") errors.push(`Sitemap không được dùng hostname www: ${url}`);
  if (parsed.origin !== canonicalOrigin) {
    errors.push(`Sitemap phải dùng canonical apex ${canonicalOrigin}: ${url}`);
    continue;
  }
  if (parsed.search || parsed.hash) errors.push(`Sitemap không được chứa query string hoặc fragment: ${url}`);
  if (parsed.pathname !== "/" && !parsed.pathname.endsWith("/")) errors.push(`Sitemap phải dùng trailing slash: ${url}`);
  if (placeholderRoutes.has(parsed.pathname)) errors.push(`Sitemap chứa brand/catalogue placeholder noindex: ${url}`);
  if (utilityOrNotFoundRoutes.has(parsed.pathname)) errors.push(`Sitemap chứa utility, noindex hoặc 404 route: ${url}`);

  const outputPath = outputPathFor(parsed.pathname);
  if (!existsSync(outputPath)) errors.push(`Sitemap trỏ tới route không được export: ${parsed.pathname}`);

  if (existsSync(outputPath)) {
    const { canonicals, robots } = pageMetadata(readFileSync(outputPath, "utf8"));
    if (canonicals.length !== 1 || canonicals[0]?.href !== url) {
      errors.push(`${url}: canonical phải xuất hiện đúng một lần và khớp chính xác URL sitemap.`);
    }
    if (robots.some((robot) => /(?:^|\s*,\s*)noindex(?:\s*,\s*|$)/i.test(robot.content ?? ""))) {
      errors.push(`${url}: robots không được chứa noindex.`);
    }
  }
}

if (httpOrigin) {
  let base;
  try { base = new URL(httpOrigin); } catch { errors.push(`SITEMAP_CHECK_ORIGIN không hợp lệ: ${httpOrigin}`); }
  if (base) {
    const checks = await Promise.all(urls.map(async (url) => {
      const parsed = new URL(url);
      const requestUrl = new URL(`${parsed.pathname}${parsed.search}`, base).toString();
      try {
        const response = await fetch(requestUrl, { redirect: "manual" });
        return { url, status: response.status, location: response.headers.get("location") };
      } catch (error) {
        return { url, error: error instanceof Error ? error.message : String(error) };
      }
    }));
    for (const check of checks) {
      if (check.error) errors.push(`${check.url}: HTTP request thất bại: ${check.error}`);
      else if (check.status !== 200) errors.push(`${check.url}: phải trả HTTP 200 trực tiếp, nhận ${check.status}.`);
      if (check.location) errors.push(`${check.url}: không được trả header Location (${check.location}).`);
    }
  }
}

if (errors.length) {
  console.error(`Sitemap output validation thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Sitemap output validation pass: ${urls.length} URL hợp lệ, canonical self-reference và robots indexable${httpOrigin ? "; HTTP direct pass" : ""}.`);
