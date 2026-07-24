import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import { chromium } from "playwright";
import { tsImport } from "tsx/esm/api";

const origin = process.env.LISTING_CHECK_ORIGIN;
const runtimeLabel = process.env.TASK14_RUNTIME_LABEL || "runtime";
const screenshotDirectory = process.env.TASK14_SCREENSHOT_DIR;
const siteUrl = "https://mdftungphat.com";
const errors = [];
const metrics = {};

if (!origin) {
  console.error("Thiếu LISTING_CHECK_ORIGIN, ví dụ http://127.0.0.1:4174.");
  process.exit(1);
}

const protectedHashes = {
  "app/page.tsx": "1f41ecdaddce7d3b78e12e51d5624cab41fee4c60bce120344921f730c7571bb",
  "app/[slug]/page.tsx": "7c99b7e93c1a62136997a0179fc53493327974b97f1cb3a70d4132dc500c681c",
  "components/Header.tsx": "50f271d5649448492e2563a4945c5b85317857ae668607885a27db6462e2ce09",
  "components/Footer.tsx": "e1b5157eba8ca2655670b9b5967ec5836d82c8484f2045ddd591d142eeaa52bf",
  "components/Hero.tsx": "cf9ee5f13693e357e42cad4606455d996564c6e41d65f036bb05c5ec0e947bec",
  "components/Partners.tsx": "8ac977228dd311aae5c31258f2e4d329ccb582f508780b6d437fd5bbb1d124cd",
  "components/WorkshopMedia.tsx": "3d52773978e5438be85035752edf1aff28f786c564a0c705864c84c71d580146",
  "components/content/MarkdownContent.tsx": "1d19ca92899e2e218c08b1ace12be9c5835896518a86f743d001f39b2067d22c",
  "components/content/ProductLanding.tsx": "1ff4cdd3e164d7bdbaf83683189262ce900f6397a2402a029fb65cfa69290fad",
  "components/content/ServiceLanding.tsx": "fe7dcf735683435eece90725d1b02a8f7eac187d416716c05ac5aaa8175a5d4d",
  "lib/seo.ts": "c3b4a32c5d65bc2b740f865e7c8b765bd57d85407914eceaec9c0c8bf28581d2",
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
  const root = path.resolve("quote-app");
  const files = walkFiles(root).sort();
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
    googlebot: tags.filter((tag) => tag.name?.toLowerCase() === "googlebot"),
    openGraphUrls: tags.filter((tag) => tag.property?.toLowerCase() === "og:url"),
  };
}

function directives(value) {
  return new Set((value || "").toLowerCase().split(/\s*,\s*/u).filter(Boolean));
}

function checkRobots(label, value, expectedIndex) {
  const values = directives(value);
  const expected = expectedIndex ? "index" : "noindex";
  const conflicting = expectedIndex ? "noindex" : "index";
  if (!values.has(expected) || values.has(conflicting) || !values.has("follow") || values.has("nofollow")) {
    errors.push(`${label}: robots phải là ${expected}, follow; nhận '${value || "-"}'.`);
  }
}

function checkXRobots(label, value, expectedIndex) {
  if (!value) return;
  const values = directives(value);
  if (values.has(expectedIndex ? "noindex" : "index") || values.has("nofollow")) {
    errors.push(`${label}: X-Robots-Tag mâu thuẫn với meta robots ('${value}').`);
  }
}

async function directRequest(route) {
  const response = await fetch(new URL(route, origin), { redirect: "manual" });
  return {
    status: response.status,
    location: response.headers.get("location"),
    xRobotsTag: response.headers.get("x-robots-tag") || "",
    contentType: response.headers.get("content-type") || "",
    body: await response.text(),
  };
}

function schemaObjects(value, result = []) {
  if (Array.isArray(value)) {
    for (const item of value) schemaObjects(item, result);
    return result;
  }
  if (!value || typeof value !== "object") return result;
  if ("@type" in value) result.push(value);
  for (const nested of Object.values(value)) schemaObjects(nested, result);
  return result;
}

async function collectionState(folder, schema, filterPublishedContent) {
  const directory = path.resolve("content", folder);
  const files = readdirSync(directory).filter((file) => /\.mdx?$/u.test(file)).sort();
  const valid = [];
  const invalid = [];
  for (const file of files) {
    const parsed = matter(readFileSync(path.join(directory, file), "utf8"));
    const result = schema.safeParse(parsed.data);
    if (result.success) valid.push(result.data);
    else invalid.push(file);
  }
  return {
    total: files.length,
    valid,
    invalid,
    published: filterPublishedContent(valid),
    drafts: valid.filter((entry) => entry.draft),
    excludedNoindex: valid.filter((entry) => !entry.draft && entry.noindex),
  };
}

for (const [file, expected] of Object.entries(protectedHashes)) {
  if (!existsSync(file)) {
    errors.push(`Hash protection: thiếu ${file}.`);
    continue;
  }
  const actual = sha256(readFileSync(file));
  if (actual !== expected) errors.push(`Hash protection: ${file} đã drift ngoài phạm vi task 14.`);
}

const quoteManifest = quoteAppManifest();
if (JSON.stringify(quoteManifest) !== JSON.stringify(quoteAppBaseline)) {
  errors.push(`quote-app drift: expected ${JSON.stringify(quoteAppBaseline)}, nhận ${JSON.stringify(quoteManifest)}.`);
}
if (existsSync("quote-app/public/.DS_Store") || existsSync("quote-app/src/.DS_Store")) {
  errors.push("quote-app: hai file .DS_Store đã bị restore ngoài yêu cầu.");
}

const [{ articleSchema, projectSchema }, { filterPublishedContent, getListingIndexability }] = await Promise.all([
  tsImport("../lib/content-schema.ts", import.meta.url),
  tsImport("../lib/listing-indexability.ts", import.meta.url),
]);
const [articleState, projectState] = await Promise.all([
  collectionState("articles", articleSchema, filterPublishedContent),
  collectionState("projects", projectSchema, filterPublishedContent),
]);

const listings = [
  {
    route: "/bai-viet/",
    detailPrefix: "/bai-viet/",
    emptyHeading: "Chưa có bài viết được xuất bản",
    state: articleState,
  },
  {
    route: "/du-an/",
    detailPrefix: "/du-an/",
    emptyHeading: "Chưa có dự án được xuất bản",
    state: projectState,
  },
];

const sitemapResponse = await directRequest("/sitemap.xml");
if (sitemapResponse.status !== 200 || sitemapResponse.location) {
  errors.push(`/sitemap.xml: phải trả 200 trực tiếp, nhận ${sitemapResponse.status}, Location=${sitemapResponse.location || "-"}.`);
}
const sitemapUrls = [...sitemapResponse.body.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
let sitemapRedirects = 0;
let sitemapNoindexUrls = 0;

for (const listing of listings) {
  const expected = getListingIndexability(listing.state.published.length);
  const canonical = `${siteUrl}${listing.route}`;
  const included = sitemapSet.has(canonical);
  if (included !== expected.includeInSitemap) {
    errors.push(`${listing.route}: sitemap inclusion=${included}, expected=${expected.includeInSitemap}.`);
  }
  for (const draft of listing.state.drafts) {
    const draftUrl = `${siteUrl}${listing.detailPrefix}${draft.slug}/`;
    if (sitemapSet.has(draftUrl)) errors.push(`${listing.route}: draft ${draft.slug} xuất hiện trong sitemap.`);
  }
}

for (const url of sitemapUrls) {
  const parsed = new URL(url);
  const response = await directRequest(parsed.pathname);
  if (response.status !== 200 || response.location) {
    sitemapRedirects += 1;
    errors.push(`${url}: sitemap URL phải trả 200 trực tiếp, nhận ${response.status}, Location=${response.location || "-"}.`);
  }
  const metadata = pageMetadata(response.body);
  const robots = metadata.robots[0]?.content || "";
  if (directives(robots).has("noindex") || directives(response.xRobotsTag).has("noindex")) {
    sitemapNoindexUrls += 1;
    errors.push(`${url}: sitemap chứa URL noindex.`);
  }
}

for (const listing of listings) {
  for (const draft of listing.state.drafts) {
    const route = `${listing.detailPrefix}${draft.slug}/`;
    const response = await directRequest(route);
    if (response.status !== 404 || response.location) {
      errors.push(`${route}: draft detail phải giữ 404 trực tiếp, nhận ${response.status}, Location=${response.location || "-"}.`);
    }
    const outputPath = path.join("out", route, "index.html");
    if (existsSync(outputPath)) errors.push(`${route}: draft detail không được tồn tại trong static export.`);
  }
  for (const published of listing.state.published) {
    const route = `${listing.detailPrefix}${published.slug}/`;
    const response = await directRequest(route);
    if (response.status !== 200 || response.location) errors.push(`${route}: published detail phải trả 200 trực tiếp.`);
    if (!sitemapSet.has(`${siteUrl}${route}`)) errors.push(`${route}: published detail thiếu trong sitemap.`);
    const robots = pageMetadata(response.body).robots[0]?.content || "";
    checkRobots(route, robots, true);
  }
}

const legalRoutes = ["/chinh-sach-bao-mat/", "/dieu-khoan-su-dung/"];
const placeholderRoutes = [
  "/catalogue/an-cuong/",
  "/catalogue/ba-thanh/",
  "/catalogue/thanh-thuy/",
  "/san-pham/an-cuong/",
  "/san-pham/ba-thanh/",
  "/san-pham/kes/",
  "/san-pham/thanh-thuy/",
];

for (const [route, expectedIndex] of [...legalRoutes.map((route) => [route, true]), ...placeholderRoutes.map((route) => [route, false])]) {
  const response = await directRequest(route);
  if (response.status !== 200 || response.location) errors.push(`${route}: regression route phải trả 200 trực tiếp.`);
  const metadata = pageMetadata(response.body);
  checkRobots(route, metadata.robots[0]?.content || "", expectedIndex);
  checkXRobots(route, response.xRobotsTag, expectedIndex);
}

const business = JSON.parse(readFileSync("content/settings/business.json", "utf8"));
const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];
const internalRoutes = new Set();

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => {
    window.__task14Cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__task14Cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  for (const listing of listings) {
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || "failed"}`));

    const response = await page.goto(new URL(listing.route, origin).toString(), { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const dom = await page.evaluate(() => {
      const parsedSchemas = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((node) => {
        try {
          const value = JSON.parse(node.textContent || "null");
          return Array.isArray(value) ? value : [value];
        } catch {
          return [{ invalidJsonLd: true }];
        }
      });
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
        ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") || "",
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
        googlebot: document.querySelector('meta[name="googlebot"]')?.getAttribute("content") || "",
        h1Count: document.querySelectorAll("h1").length,
        mainWords: (document.querySelector("main")?.textContent || "").trim().split(/\s+/u).filter(Boolean).length,
        mainText: (document.querySelector("main")?.textContent || "").replace(/\s+/gu, " ").trim(),
        h2Texts: [...document.querySelectorAll("main h2")].map((heading) => heading.textContent?.replace(/\s+/gu, " ").trim() || ""),
        cardRoutes: [...document.querySelectorAll("main article")].map((card) => {
          const href = card.querySelector("a[href]")?.getAttribute("href") || "";
          return href ? new URL(href, location.origin).pathname : "";
        }),
        schemas: parsedSchemas,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
        cls: window.__task14Cls || 0,
        links: [...document.querySelectorAll("a[href]")].map((link) => link.getAttribute("href") || ""),
        phoneLinks: [...document.querySelectorAll('a[href^="tel:"]')].map((link) => link.getAttribute("href")),
        zaloLinks: [...document.querySelectorAll("a[href]")].map((link) => link.getAttribute("href") || "").filter((href) => href.includes("zalo.me")),
      };
    });

    const expected = getListingIndexability(listing.state.published.length);
    const expectedCanonical = `${siteUrl}${listing.route}`;
    const rawResponse = await directRequest(listing.route);
    const rawMetadata = pageMetadata(rawResponse.body);
    if (rawResponse.status !== 200 || rawResponse.location) errors.push(`${listing.route}: HTTP phải là 200 trực tiếp.`);
    if (response?.status() !== 200 || response?.request().redirectedFrom()) errors.push(`${listing.route}: browser không nhận 200 trực tiếp.`);
    if (dom.canonical !== expectedCanonical || dom.ogUrl !== expectedCanonical) errors.push(`${listing.route}: DOM canonical/og:url không self-canonical.`);
    if (rawMetadata.canonicals.length !== 1 || rawMetadata.canonicals[0]?.href !== expectedCanonical) errors.push(`${listing.route}: raw HTML canonical không đúng.`);
    if (rawMetadata.openGraphUrls.length !== 1 || rawMetadata.openGraphUrls[0]?.content !== expectedCanonical) errors.push(`${listing.route}: raw HTML og:url không đúng.`);
    checkRobots(`${listing.route} DOM`, dom.robots, expected.index);
    checkRobots(`${listing.route} raw HTML`, rawMetadata.robots[0]?.content || "", expected.index);
    checkRobots(`${listing.route} googlebot`, dom.googlebot, expected.index);
    checkXRobots(listing.route, rawResponse.xRobotsTag, expected.index);
    if (dom.h1Count !== 1) errors.push(`${listing.route}: cần đúng một H1, nhận ${dom.h1Count}.`);
    if (dom.cardRoutes.length !== listing.state.published.length) errors.push(`${listing.route}: card count ${dom.cardRoutes.length} không khớp published count ${listing.state.published.length}.`);
    if (listing.state.published.length === 0) {
      if (!dom.h2Texts.includes(listing.emptyHeading)) {
        errors.push(`${listing.route}: empty state phải hiển thị heading '${listing.emptyHeading}'.`);
      }
      if (/(?:^|\s)404(?:\s|$)|không tìm thấy trang/iu.test(dom.mainText)) {
        errors.push(`${listing.route}: empty state không được dùng wording soft-404.`);
      }
    }

    const expectedCardRoutes = listing.state.published.map((entry) => `${listing.detailPrefix}${entry.slug}/`).sort();
    if (JSON.stringify([...new Set(dom.cardRoutes)].sort()) !== JSON.stringify(expectedCardRoutes)) {
      errors.push(`${listing.route}: rendered cards không khớp published source.`);
    }
    const typedSchemas = dom.schemas.flatMap((schema) => schemaObjects(schema));
    const itemLists = typedSchemas.filter((schema) => schema["@type"] === "ItemList");
    const fakeContentTypes = typedSchemas.filter((schema) => ["Article", "BlogPosting", "CreativeWork", "Project"].includes(schema["@type"]));
    if (listing.state.published.length === 0 && (itemLists.length || fakeContentTypes.length)) {
      errors.push(`${listing.route}: empty listing chứa schema item giả.`);
    }
    for (const itemList of itemLists) {
      if ((itemList.itemListElement || []).length !== listing.state.published.length) errors.push(`${listing.route}: ItemList count không khớp published count.`);
    }
    if (dom.overflow > 0) errors.push(`${listing.route} ${viewport.name}: page overflow ${dom.overflow}px.`);
    if (dom.cls > 0.1) errors.push(`${listing.route} ${viewport.name}: CLS ${dom.cls} vượt 0.1.`);
    if (dom.brokenImages.length) errors.push(`${listing.route} ${viewport.name}: broken images ${dom.brokenImages.join(", ")}.`);
    if (consoleErrors.length || pageErrors.length || failedRequests.length) {
      errors.push(`${listing.route} ${viewport.name}: runtime errors console=${consoleErrors.length}, page=${pageErrors.length}, request=${failedRequests.length}.`);
    }
    if (!dom.phoneLinks.includes(`tel:${business.phoneE164}`)) errors.push(`${listing.route}: thiếu phone CTA hiện hành.`);
    if (!dom.zaloLinks.includes(business.zaloUrl)) errors.push(`${listing.route}: thiếu Zalo CTA hiện hành.`);

    for (const href of dom.links) {
      if (!href || /^(?:mailto:|tel:|javascript:)/iu.test(href)) continue;
      const parsed = new URL(href, origin);
      if (parsed.origin !== new URL(origin).origin) continue;
      if (parsed.pathname !== "/" && !parsed.pathname.endsWith("/") && !path.posix.extname(parsed.pathname)) {
        errors.push(`${listing.route}: internal link thiếu trailing slash (${href}).`);
      }
      internalRoutes.add(parsed.pathname);
    }

    if (screenshotDirectory) {
      const slug = listing.route.replaceAll("/", "") || "home";
      await page.screenshot({ path: path.join(screenshotDirectory, `${runtimeLabel}-${slug}-${viewport.name}.png`), fullPage: true });
    }
    metrics[`${runtimeLabel}:${viewport.name}:${listing.route}`] = {
      published: listing.state.published.length,
      cards: dom.cardRoutes.length,
      title: dom.title,
      description: dom.description,
      canonical: dom.canonical,
      ogUrl: dom.ogUrl,
      robots: dom.robots,
      xRobotsTag: rawResponse.xRobotsTag || null,
      h1: dom.h1Count,
      mainWords: dom.mainWords,
      internalLinks: dom.links.filter((href) => {
        if (!href || /^(?:mailto:|tel:|javascript:)/iu.test(href)) return false;
        return new URL(href, origin).origin === new URL(origin).origin;
      }).length,
      schemaTypes: [...new Set(typedSchemas.map((schema) => schema["@type"]).filter(Boolean))],
      emptyStateVisible: listing.state.published.length === 0 && dom.h2Texts.includes(listing.emptyHeading),
      overflow: dom.overflow,
      cls: dom.cls,
      brokenImages: dom.brokenImages.length,
      runtimeErrors: consoleErrors.length + pageErrors.length + failedRequests.length,
    };
    await page.close();
  }
  await context.close();
}
await browser.close();

let internalRedirects = 0;
let internalErrors = 0;
for (const route of internalRoutes) {
  const response = await directRequest(route);
  if (response.location || (response.status >= 300 && response.status < 400)) {
    internalRedirects += 1;
    errors.push(`${route}: internal link redirect (${response.status}, ${response.location || "-"}).`);
  } else if (response.status >= 400) {
    internalErrors += 1;
    errors.push(`${route}: internal link trả ${response.status}.`);
  }
}

const summary = {
  runtime: runtimeLabel,
  source: {
    articles: { total: articleState.total, published: articleState.published.length, drafts: articleState.drafts.length, invalid: articleState.invalid.length, excludedNoindex: articleState.excludedNoindex.length },
    projects: { total: projectState.total, published: projectState.published.length, drafts: projectState.drafts.length, invalid: projectState.invalid.length, excludedNoindex: projectState.excludedNoindex.length },
  },
  sitemap: { count: sitemapUrls.length, noindexUrls: sitemapNoindexUrls, redirects: sitemapRedirects },
  internalLinks: { redirects: internalRedirects, errors: internalErrors },
  quoteApp: quoteManifest,
  metrics,
};

if (errors.length) {
  console.error(`Empty listing indexability validation thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("Empty listing indexability validation pass.");
console.log(JSON.stringify(summary, null, 2));
