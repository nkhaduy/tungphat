import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const originValue = process.env.TITLE_CHECK_ORIGIN ?? process.argv[2];
const runtimeLabel = process.env.TITLE_CHECK_RUNTIME ?? "runtime";
const siteUrl = "https://mdftungphat.com";
const brand = "Tùng Phát";
const errors = [];

if (!originValue) {
  console.error("Thiếu TITLE_CHECK_ORIGIN, ví dụ http://127.0.0.1:4174.");
  process.exit(1);
}

let origin;
try {
  origin = new URL(originValue);
} catch {
  console.error(`TITLE_CHECK_ORIGIN không hợp lệ: ${originValue}`);
  process.exit(1);
}

const protectedHashes = {
  "app/page.tsx": "1f41ecdaddce7d3b78e12e51d5624cab41fee4c60bce120344921f730c7571bb",
  "app/sitemap.ts": "01c33c2f5c3062a08fc5097a62bc084c0e1afe645ad5b760071c0b7a4368b79e",
  "components/Header.tsx": "50f271d5649448492e2563a4945c5b85317857ae668607885a27db6462e2ce09",
  "components/Footer.tsx": "e1b5157eba8ca2655670b9b5967ec5836d82c8484f2045ddd591d142eeaa52bf",
  "components/Hero.tsx": "cf9ee5f13693e357e42cad4606455d996564c6e41d65f036bb05c5ec0e947bec",
  "components/Partners.tsx": "8ac977228dd311aae5c31258f2e4d329ccb582f508780b6d437fd5bbb1d124cd",
  "components/WorkshopMedia.tsx": "3d52773978e5438be85035752edf1aff28f786c564a0c705864c84c71d580146",
  "components/content/MarkdownContent.tsx": "1d19ca92899e2e218c08b1ace12be9c5835896518a86f743d001f39b2067d22c",
  "components/content/ProductLanding.tsx": "1ff4cdd3e164d7bdbaf83683189262ce900f6397a2402a029fb65cfa69290fad",
  "components/content/ServiceLanding.tsx": "fe7dcf735683435eece90725d1b02a8f7eac187d416716c05ac5aaa8175a5d4d",
  "content/products/van-mdf.md": "81b7bf94bb09de778056d4946d2b17dd3b48365c099b0d5264a0a03023a992fa",
  "content/products/mdf-chong-am.md": "dbbf760a92d28ef04c364e703911419a0b7d6d036a44a1aa52e160bc27b3092a",
  "content/products/van-go-cong-nghiep.md": "6b38d451f730761caec9c8d07b955d1c6191857f9c5932330dff0f936a32126d",
  "content/products/go-ghep.md": "bfea5e6e4af0b456171e4a3981377f147118ecef658320497380a671be40657f",
  "content/products/go-ghep-cao-su.md": "9b76359a46276cceaae52ffbfb46e1db2b360d2524ea5c212a99664281a789f2",
  "content/products/go-ghep-tram.md": "5c14549d5640d455d88282def23d8bec495b6b2b0a53b93f3bfbe8a03f37c5be",
  "content/pages/cat-cnc-go.md": "ac683fbccf7e78c0c8c15b9d4b2ed38305dc8dfe221e3e7ce4afaa8d9ce3cee7",
  "content/pages/gia-cong-cnc-mdf.md": "978a4f30d54eb8fb6882af7886ea2392a81fe42ac4ddc5345f0a3ce1198fac03",
};

const quoteAppBaseline = {
  fileCount: 14252,
  bytes: 560715133,
  sha256: "cfc8239b063d49cc8f1b15654b5994fe106eeea4602dfac041958c95a0f2fc8b",
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolute) : entry.isFile() ? [absolute] : [];
  });
}

function quoteAppManifest() {
  const files = walkFiles(path.resolve("quote-app")).sort();
  let bytes = 0;
  let manifest = "";
  for (const file of files) {
    const content = readFileSync(file);
    bytes += content.byteLength;
    const relative = path.relative(process.cwd(), file).split(path.sep).join("/");
    manifest += `${sha256(content)}  ${relative}\n`;
  }
  return { fileCount: files.length, bytes, sha256: sha256(manifest) };
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/gu)].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? match[3],
    ]),
  );
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function metadata(html) {
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/giu)].map((match) =>
    decodeHtml(match[1].replace(/<[^>]+>/gu, "").trim()),
  );
  const metas = [...html.matchAll(/<meta\b[^>]*>/giu)].map((match) => attributes(match[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/giu)].map((match) => attributes(match[0]));
  return {
    titles,
    description: metas.find((tag) => tag.name?.toLowerCase() === "description")?.content || "",
    robots: metas.find((tag) => tag.name?.toLowerCase() === "robots")?.content || "",
    ogTitle: metas.find((tag) => tag.property?.toLowerCase() === "og:title")?.content || "",
    twitterTitle: metas.find((tag) => tag.name?.toLowerCase() === "twitter:title")?.content || "",
    canonical: links.find((tag) => tag.rel?.toLowerCase() === "canonical")?.href || "",
  };
}

function titleAudit(value) {
  const title = value.trim();
  const brandCount = title.match(/Tùng Phát/gu)?.length ?? 0;
  const suffixes = title.match(/\|\s*Tùng Phát(?=\s*(?:\|\s*Tùng Phát)*\s*$)/gu)?.length ?? 0;
  return {
    title,
    brandCount,
    suffixes,
    duplicateSuffix: /(?:\|\s*Tùng Phát\s*){2,}$/u.test(title),
    malformedSeparator: /^\s*\||\|\s*$|\|\s*\|/u.test(title),
  };
}

function routeForOutput(file) {
  const relative = path.relative("out", file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative === "404.html" || relative === "404/index.html") return "/404/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative.replace(/\.html$/u, "/")}`;
}

function exportedRoutes() {
  const routes = new Map();
  for (const file of walkFiles(path.resolve("out")).filter((entry) => entry.endsWith(".html")).sort()) {
    const route = routeForOutput(file);
    if (!routes.has(route) || file.endsWith("/index.html")) routes.set(route, file);
  }
  return routes;
}

function directives(value) {
  return new Set(value.toLowerCase().split(/\s*,\s*/u).filter(Boolean));
}

function checkRobots(route, value, expectedIndex, expectedFollow = true) {
  const values = directives(value);
  const index = expectedIndex ? "index" : "noindex";
  const follow = expectedFollow ? "follow" : "nofollow";
  if (!values.has(index) || !values.has(follow)) {
    errors.push(`${route}: robots phải chứa ${index}, ${follow}; nhận '${value || "-"}'.`);
  }
}

async function directRequest(route) {
  const response = await fetch(new URL(route, origin), { redirect: "manual" });
  return {
    status: response.status,
    location: response.headers.get("location"),
    body: await response.text(),
  };
}

for (const [file, expected] of Object.entries(protectedHashes)) {
  if (!existsSync(file)) errors.push(`Hash protection: thiếu ${file}.`);
  else if (sha256(readFileSync(file)) !== expected) errors.push(`Hash protection: ${file} drift ngoài task 15.`);
}

const quoteManifest = quoteAppManifest();
if (JSON.stringify(quoteManifest) !== JSON.stringify(quoteAppBaseline)) {
  errors.push(`quote-app drift: expected ${JSON.stringify(quoteAppBaseline)}, nhận ${JSON.stringify(quoteManifest)}.`);
}
if (existsSync("quote-app/public/.DS_Store") || existsSync("quote-app/src/.DS_Store")) {
  errors.push("quote-app: hai file .DS_Store đã bị restore.");
}

const routes = exportedRoutes();
const rows = [];
for (const [route, outputPath] of routes) {
  const staticHtml = readFileSync(outputPath, "utf8");
  const response = route === "/404/" ? null : await directRequest(route);
  if (response && (response.status !== 200 || response.location)) {
    errors.push(`${route}: public route phải trả 200 trực tiếp, nhận ${response.status}, Location=${response.location || "-"}.`);
  }

  const staticMetadata = metadata(staticHtml);
  const runtimeMetadata = response ? metadata(response.body) : staticMetadata;
  const documentTitle = titleAudit(runtimeMetadata.titles[0] || "");
  const ogTitle = titleAudit(runtimeMetadata.ogTitle);
  const twitterTitle = titleAudit(runtimeMetadata.twitterTitle);

  if (runtimeMetadata.titles.length !== 1) errors.push(`${route}: cần đúng một <title>, nhận ${runtimeMetadata.titles.length}.`);
  if (!documentTitle.title) errors.push(`${route}: document title rỗng.`);
  if (!ogTitle.title) errors.push(`${route}: og:title rỗng.`);
  if (!twitterTitle.title) errors.push(`${route}: twitter:title rỗng.`);
  for (const [label, audit] of [["title", documentTitle], ["og:title", ogTitle], ["twitter:title", twitterTitle]]) {
    if (audit.duplicateSuffix) errors.push(`${route}: ${label} lặp terminal suffix ('${audit.title}').`);
    if (audit.brandCount >= 3) errors.push(`${route}: ${label} chứa brand ${audit.brandCount} lần.`);
    if (audit.malformedSeparator) errors.push(`${route}: ${label} có separator malformed ('${audit.title}').`);
  }
  if (route === "/" && documentTitle.title === `${brand} | ${brand}`) errors.push("/: homepage bị lặp brand.");
  if (route !== "/" && documentTitle.suffixes !== 1) {
    errors.push(`${route}: title trang con phải có đúng một terminal suffix, nhận ${documentTitle.suffixes}.`);
  }

  rows.push({
    route,
    status: response?.status ?? 404,
    title: documentTitle.title,
    brandCount: documentTitle.brandCount,
    suffixCount: documentTitle.suffixes,
    length: [...documentTitle.title].length,
    ogTitle: ogTitle.title,
    twitterTitle: twitterTitle.title,
    robots: runtimeMetadata.robots,
    canonical: runtimeMetadata.canonical,
    description: runtimeMetadata.description,
  });
}

const sitemapResponse = await directRequest("/sitemap.xml");
const sitemapUrls = [...sitemapResponse.body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
if (sitemapResponse.status !== 200 || sitemapResponse.location) errors.push("/sitemap.xml phải trả 200 trực tiếp.");
if (sitemapUrls.length !== 14) errors.push(`Sitemap phải giữ 14 URL, nhận ${sitemapUrls.length}.`);
if (sitemapUrls.includes(`${siteUrl}/bai-viet/`) || sitemapUrls.includes(`${siteUrl}/du-an/`)) {
  errors.push("Hai empty listing không được xuất hiện trong sitemap.");
}

for (const route of ["/bai-viet/", "/du-an/"]) {
  const row = rows.find((entry) => entry.route === route);
  checkRobots(route, row?.robots || "", false, true);
}
for (const route of ["/chinh-sach-bao-mat/", "/dieu-khoan-su-dung/"]) {
  const row = rows.find((entry) => entry.route === route);
  checkRobots(route, row?.robots || "", true, true);
}
for (const route of [
  "/catalogue/an-cuong/", "/catalogue/ba-thanh/", "/catalogue/thanh-thuy/",
  "/san-pham/an-cuong/", "/san-pham/ba-thanh/", "/san-pham/kes/", "/san-pham/thanh-thuy/",
]) {
  const row = rows.find((entry) => entry.route === route);
  checkRobots(route, row?.robots || "", false, true);
}

const representativeRoutes = ["/", "/van-mdf/", "/cat-cnc-go/", "/bai-viet/", "/san-pham/an-cuong/"];
const representativeBaseline = {
  "/": {
    h1: ["Vật liệu gỗ ghépGia công CNC"],
    canonical: `${siteUrl}/`,
    robots: "index, follow",
  },
  "/van-mdf/": {
    h1: ["Ván MDF tại TP.HCM"],
    canonical: `${siteUrl}/van-mdf/`,
    robots: "index, follow",
  },
  "/cat-cnc-go/": {
    h1: ["Cắt CNC gỗ theo file, bản vẽ tại TP.HCM"],
    canonical: `${siteUrl}/cat-cnc-go/`,
    robots: "index, follow",
  },
  "/bai-viet/": {
    h1: ["Kiến thức vật liệu và CNC"],
    canonical: `${siteUrl}/bai-viet/`,
    robots: "noindex, follow",
  },
  "/san-pham/an-cuong/": {
    h1: ["An Cường"],
    canonical: `${siteUrl}/san-pham/an-cuong/`,
    robots: "noindex, follow",
  },
};
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];
const runtime = [];
const browser = await chromium.launch({ headless: true });
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  for (const route of representativeRoutes) {
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(new URL(route, origin).toString(), { waitUntil: "networkidle" });
    const dom = await page.evaluate(() => ({
      title: document.title,
      h1: [...document.querySelectorAll("h1")].map((heading) => heading.textContent?.replace(/\s+/gu, " ").trim() || ""),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    if (response?.status() !== 200 || response?.request().redirectedFrom()) errors.push(`${route} ${viewport.name}: browser không nhận 200 trực tiếp.`);
    if (dom.h1.length !== 1) errors.push(`${route} ${viewport.name}: cần đúng một H1, nhận ${dom.h1.length}.`);
    const baseline = representativeBaseline[route];
    if (JSON.stringify(dom.h1) !== JSON.stringify(baseline.h1)) errors.push(`${route} ${viewport.name}: H1 drift ngoài task 15.`);
    if (dom.canonical !== baseline.canonical) errors.push(`${route} ${viewport.name}: canonical drift ngoài task 15.`);
    if (dom.robots !== baseline.robots) errors.push(`${route} ${viewport.name}: robots drift ngoài task 15.`);
    if (dom.overflow > 0) errors.push(`${route} ${viewport.name}: overflow ${dom.overflow}px.`);
    if (consoleErrors.length || pageErrors.length) errors.push(`${route} ${viewport.name}: runtime errors console=${consoleErrors.length}, page=${pageErrors.length}.`);
    runtime.push({ route, viewport: viewport.name, ...dom, runtimeErrors: consoleErrors.length + pageErrors.length });
    await page.close();
  }
  await context.close();
}
await browser.close();

const summary = {
  runtime: runtimeLabel,
  publicRoutes: rows.length,
  duplicateSuffixes: rows.filter((row) => titleAudit(row.title).duplicateSuffix).length,
  malformedSeparators: rows.filter((row) => titleAudit(row.title).malformedSeparator).length,
  ogDuplicates: rows.filter((row) => titleAudit(row.ogTitle).duplicateSuffix).length,
  twitterDuplicates: rows.filter((row) => titleAudit(row.twitterTitle).duplicateSuffix).length,
  missingTitles: rows.filter((row) => !row.title).length,
  sitemapCount: sitemapUrls.length,
  quoteApp: quoteManifest,
  problems: rows.filter((row) => {
    const title = titleAudit(row.title);
    return title.duplicateSuffix || title.brandCount > 1 || title.malformedSeparator;
  }),
  runtimeChecks: runtime,
};

if (errors.length) {
  console.error(`Title suffix validation thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("Title suffix validation pass.");
console.log(JSON.stringify(summary, null, 2));
