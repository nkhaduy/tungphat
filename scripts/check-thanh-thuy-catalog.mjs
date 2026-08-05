import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "out");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/thanh-thuy/catalog.json"), "utf8"));
const errors = [];
const topCategories = catalog.categories.filter((category) => !category.parentSlug);
const ready = catalog.products.filter((product) => product.published && product.seoStatus === "READY_TO_INDEX");
const noindex = catalog.products.filter((product) => product.seoStatus !== "READY_TO_INDEX");
const routeForProduct = (product) => `/san-pham/${product.categorySlug}/${product.slug}/`;
const htmlFor = (route) => {
  const relative = route.replace(/^\/+|\/+$/g, "");
  const file = relative ? path.join(out, relative, "index.html") : path.join(out, "index.html");
  if (!fs.existsSync(file)) {
    errors.push(`Thiếu route export: ${route}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};
const meta = (html, name) => html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)`, "i"))?.[1]
  ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, "i"))?.[1]
  ?? "";
const canonical = (html) => html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
  ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
  ?? "";
const title = (html) => html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "";
const description = (html) => meta(html, "description");
const indexableRoutes = [
  "/thuong-hieu/thanh-thuy/",
  ...topCategories.map((category) => `/san-pham/${category.slug}/`),
  ...ready.map(routeForProduct),
];
const titles = new Set();
const descriptions = new Set();
for (const route of indexableRoutes) {
  const html = htmlFor(route);
  const expectedCanonical = `https://mdftungphat.com${route}`;
  if (canonical(html) !== expectedCanonical) errors.push(`Canonical sai ${route}: ${canonical(html)}`);
  if ((html.match(/<h1\b/gi) || []).length !== 1) errors.push(`H1 không duy nhất: ${route}`);
  if (!title(html) || titles.has(title(html))) errors.push(`Title thiếu/trùng: ${route}`);
  if (!description(html) || descriptions.has(description(html))) errors.push(`Description thiếu/trùng: ${route}`);
  titles.add(title(html));
  descriptions.add(description(html));
  if (/noindex/i.test(meta(html, "robots"))) errors.push(`Trang indexable bị noindex: ${route}`);
  if (/gothanhthuy\.com/i.test(canonical(html))) errors.push(`Canonical trỏ nguồn: ${route}`);
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch { errors.push(`JSON-LD lỗi: ${route}`); }
  }
}

for (const product of noindex) {
  const route = routeForProduct(product);
  const html = htmlFor(route);
  if (!/noindex/i.test(meta(html, "robots"))) errors.push(`Trang enrichment thiếu noindex: ${route}`);
}

const readyHtml = ready.map((product) => htmlFor(routeForProduct(product))).join("\n");
if (/"offers"\s*:|"price"\s*:\s*"?0/i.test(readyHtml)) errors.push("Product schema chứa Offer/giá 0 giả.");

const productRoot = path.join(out, "san-pham");
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}
const catalogueHtml = walk(productRoot).filter((file) => file.endsWith(".html")).map((file) => fs.readFileSync(file, "utf8")).join("\n");
if (/src=["']https?:\/\/www\.gothanhthuy\.com/i.test(catalogueHtml)) errors.push("Phát hiện ảnh hotlink Thanh Thuỳ trong output.");
if (/1900633668|2827\/3A Quốc Lộ/i.test(catalogueHtml)) errors.push("Phát hiện thông tin liên hệ nhà cung cấp trong output.");

const sitemap = fs.readFileSync(path.join(out, "sitemap.xml"), "utf8");
for (const route of indexableRoutes) if (!sitemap.includes(`https://mdftungphat.com${route}`)) errors.push(`Sitemap thiếu: ${route}`);
for (const product of noindex) if (sitemap.includes(`https://mdftungphat.com${routeForProduct(product)}`)) errors.push(`Sitemap chứa noindex: ${product.slug}`);
if (/<loc>[^<]*\?|<loc>[^<]*gothanhthuy\.com/i.test(sitemap)) errors.push("Sitemap chứa query/source URL.");

const robots = fs.readFileSync(path.join(out, "robots.txt"), "utf8");
if (!robots.includes("/*?search=") || !robots.includes("/*?filter=")) errors.push("Robots thiếu guard search/filter.");

if (errors.length) {
  console.error(`Thanh Thuỳ catalogue check thất bại (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Thanh Thuỳ catalogue check pass: ${catalog.products.length} sản phẩm, ${indexableRoutes.length} route indexable, ${noindex.length} product noindex, ${titles.size} title duy nhất.`);
