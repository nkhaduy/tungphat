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
  "app/page.tsx":
    "39e7b7f2c3bd96aa1be92d305e68c8a5a70af9a3eda998f51374b9d56f76a143",
  "app/[slug]/page.tsx":
    "7c99b7e93c1a62136997a0179fc53493327974b97f1cb3a70d4132dc500c681c",
  "components/site/SiteHeader.tsx":
    "a622223da03cebb8532c1f73dac3088c6a809ebbe5a7a5a7b08e684f230cc52f",
  "components/site/SiteFooter.tsx":
    "7ad41584fd31cf39faac01b10479aff9238d3516f97dcc7ca71e24c99a04fb58",
  "components/ui/PageHero.tsx":
    "d1c9ae21a456657a152d00dde0d6c70d8a637460eb52891336de2cb12442a73f",
  "components/Partners.tsx":
    "8ccc8a277f26b161b083ec6535762b54ad6c9ff007f18faedede351e9ee81d23",
  "components/WorkshopMedia.tsx":
    "c6c034ecd0f48c44ec87b8a8f273743e379a3d3ec016821acfbe0c70862b48cc",
  "components/content/MarkdownContent.tsx":
    "15144224dfc4d640045a8058add1421260609d4447ec410670b0994dd453f28d",
  "components/content/ProductLanding.tsx":
    "077fe235eb7dc8f53d58f7638d49ecd62b26c2da08f10a7281d5efa74070047d",
  "components/content/ServiceLanding.tsx":
    "06f1890cc2ec6aa7f42b1a3574a322176052df21264204c6e09d21607bd14b6f",
  "lib/seo.ts":
    "4389c195e87ced10ec39dfd87c3a6d9b05857b5c1972741440316c8b2187be6f",
  "content/products/van-mdf.md":
    "c369b1f193a39f8526e5c55fb74154e5d06e37c164893c730436341e29381a9f",
  "content/products/mdf-chong-am.md":
    "287a782a6eff363ec49f16e91f1281357351f96637211634d4e0fee5859f7448",
  "content/products/van-go-cong-nghiep.md":
    "b0de0ad498d8c7c53b9a1dc75e33d199c28cafcd726a5afee2f2ef7e88c5c491",
  "content/products/go-ghep.md":
    "bfea5e6e4af0b456171e4a3981377f147118ecef658320497380a671be40657f",
  "content/products/go-ghep-cao-su.md":
    "9b76359a46276cceaae52ffbfb46e1db2b360d2524ea5c212a99664281a789f2",
  "content/products/go-ghep-tram.md":
    "5c14549d5640d455d88282def23d8bec495b6b2b0a53b93f3bfbe8a03f37c5be",
  "content/pages/cat-cnc-go.md":
    "7996dd290de5bc914aa355c564e48317a7bd87db574a1b45190be60f3cfe1388",
  "content/pages/gia-cong-cnc-mdf.md":
    "d139e976a7da1d63b5c2cf9efbcdc00ef3476c1c40b651ba91f5b5d2fd969d9c",
};

const quoteAppBaseline = {
  fileCount: 0,
  bytes: 0,
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? walkFiles(absolute)
      : entry.isFile()
        ? [absolute]
        : [];
  });
}

function quoteAppManifest() {
  const root = path.resolve("quote-app");
  if (!existsSync(root)) {
    return { fileCount: 0, bytes: 0, sha256: sha256("") };
  }
  const files = walkFiles(root).sort();
  let bytes = 0;
  let manifest = "";
  for (const file of files) {
    const content = readFileSync(file);
    bytes += content.byteLength;
    const relative = path
      .relative(process.cwd(), file)
      .split(path.sep)
      .join("/");
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
  const tags = [...html.matchAll(/<(?:link|meta)\b[^>]*>/gi)].map((match) =>
    attributes(match[0]),
  );
  return {
    canonicals: tags.filter((tag) => tag.rel?.toLowerCase() === "canonical"),
    robots: tags.filter((tag) => tag.name?.toLowerCase() === "robots"),
    googlebot: tags.filter((tag) => tag.name?.toLowerCase() === "googlebot"),
    openGraphUrls: tags.filter(
      (tag) => tag.property?.toLowerCase() === "og:url",
    ),
  };
}

function directives(value) {
  return new Set(
    (value || "")
      .toLowerCase()
      .split(/\s*,\s*/u)
      .filter(Boolean),
  );
}

function checkRobots(label, value, expectedIndex) {
  const values = directives(value);
  const expected = expectedIndex ? "index" : "noindex";
  const conflicting = expectedIndex ? "noindex" : "index";
  if (
    !values.has(expected) ||
    values.has(conflicting) ||
    !values.has("follow") ||
    values.has("nofollow")
  ) {
    errors.push(
      `${label}: robots phải là ${expected}, follow; nhận '${value || "-"}'.`,
    );
  }
}

function checkXRobots(label, value, expectedIndex) {
  if (!value) return;
  const values = directives(value);
  if (
    values.has(expectedIndex ? "noindex" : "index") ||
    values.has("nofollow")
  ) {
    errors.push(
      `${label}: X-Robots-Tag mâu thuẫn với meta robots ('${value}').`,
    );
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
  const files = readdirSync(directory)
    .filter((file) => /\.mdx?$/u.test(file))
    .sort();
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
  if (actual !== expected)
    errors.push(`Hash protection: ${file} đã drift ngoài phạm vi task 14.`);
}

const quoteManifest = quoteAppManifest();
if (JSON.stringify(quoteManifest) !== JSON.stringify(quoteAppBaseline)) {
  errors.push(
    `quote-app drift: expected ${JSON.stringify(quoteAppBaseline)}, nhận ${JSON.stringify(quoteManifest)}.`,
  );
}
if (
  existsSync("quote-app/public/.DS_Store") ||
  existsSync("quote-app/src/.DS_Store")
) {
  errors.push("quote-app: hai file .DS_Store đã bị restore ngoài yêu cầu.");
}

const [
  { articleSchema, projectSchema },
  { filterPublishedContent, getListingIndexability },
] = await Promise.all([
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
    emptyHeading: "Nội dung đang được kiểm tra",
    state: articleState,
  },
  {
    route: "/du-an/",
    detailPrefix: "/du-an/",
    emptyHeading: null,
    hasStandaloneContent: true,
    state: projectState,
  },
];

const sitemapResponse = await directRequest("/sitemap.xml");
if (sitemapResponse.status !== 200 || sitemapResponse.location) {
  errors.push(
    `/sitemap.xml: phải trả 200 trực tiếp, nhận ${sitemapResponse.status}, Location=${sitemapResponse.location || "-"}.`,
  );
}
const sitemapUrls = [
  ...sitemapResponse.body.matchAll(/<loc>([^<]+)<\/loc>/gu),
].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
let sitemapRedirects = 0;
let sitemapNoindexUrls = 0;

for (const listing of listings) {
  const expected = getListingIndexability(listing.state.published.length, {
    hasStandaloneContent: listing.hasStandaloneContent,
  });
  const canonical = `${siteUrl}${listing.route}`;
  const included = sitemapSet.has(canonical);
  if (included !== expected.includeInSitemap) {
    errors.push(
      `${listing.route}: sitemap inclusion=${included}, expected=${expected.includeInSitemap}.`,
    );
  }
  for (const draft of listing.state.drafts) {
    const draftUrl = `${siteUrl}${listing.detailPrefix}${draft.slug}/`;
    if (sitemapSet.has(draftUrl))
      errors.push(
        `${listing.route}: draft ${draft.slug} xuất hiện trong sitemap.`,
      );
  }
}

for (const url of sitemapUrls) {
  const parsed = new URL(url);
  const response = await directRequest(parsed.pathname);
  if (response.status !== 200 || response.location) {
    sitemapRedirects += 1;
    errors.push(
      `${url}: sitemap URL phải trả 200 trực tiếp, nhận ${response.status}, Location=${response.location || "-"}.`,
    );
  }
  const metadata = pageMetadata(response.body);
  const robots = metadata.robots[0]?.content || "";
  if (
    directives(robots).has("noindex") ||
    directives(response.xRobotsTag).has("noindex")
  ) {
    sitemapNoindexUrls += 1;
    errors.push(`${url}: sitemap chứa URL noindex.`);
  }
}

for (const listing of listings) {
  for (const draft of listing.state.drafts) {
    const route = `${listing.detailPrefix}${draft.slug}/`;
    const response = await directRequest(route);
    if (response.status !== 404 || response.location) {
      errors.push(
        `${route}: draft detail phải giữ 404 trực tiếp, nhận ${response.status}, Location=${response.location || "-"}.`,
      );
    }
    const outputPath = path.join("out", route, "index.html");
    if (existsSync(outputPath))
      errors.push(
        `${route}: draft detail không được tồn tại trong static export.`,
      );
  }
  for (const published of listing.state.published) {
    const route = `${listing.detailPrefix}${published.slug}/`;
    const response = await directRequest(route);
    if (response.status !== 200 || response.location)
      errors.push(`${route}: published detail phải trả 200 trực tiếp.`);
    if (!sitemapSet.has(`${siteUrl}${route}`))
      errors.push(`${route}: published detail thiếu trong sitemap.`);
    const robots = pageMetadata(response.body).robots[0]?.content || "";
    checkRobots(route, robots, true);
  }
}

const legalRoutes = ["/chinh-sach-bao-mat/", "/dieu-khoan-su-dung/"];
const placeholderRoutes = [
  "/san-pham/an-cuong/",
  "/san-pham/ba-thanh/",
  "/san-pham/kes/",
];

const removedSentinelRoutes = ["/san-pham/thanh-thuy/"];

for (const [route, expectedIndex] of [
  ...legalRoutes.map((route) => [route, true]),
  ...placeholderRoutes.map((route) => [route, false]),
]) {
  const response = await directRequest(route);
  if (response.status !== 200 || response.location)
    errors.push(`${route}: regression route phải trả 200 trực tiếp.`);
  const metadata = pageMetadata(response.body);
  checkRobots(route, metadata.robots[0]?.content || "", expectedIndex);
  checkXRobots(route, response.xRobotsTag, expectedIndex);
}

for (const route of removedSentinelRoutes) {
  const response = await directRequest(route);
  if (response.status !== 404 || response.location) {
    errors.push(`${route}: sentinel đã loại phải trả 404 trực tiếp.`);
  }
}

const business = JSON.parse(
  readFileSync("content/settings/business.json", "utf8"),
);
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
    page.on("requestfailed", (request) =>
      failedRequests.push(
        `${request.url()} ${request.failure()?.errorText || "failed"}`,
      ),
    );

    const response = await page.goto(
      new URL(listing.route, origin).toString(),
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(500);
    const dom = await page.evaluate(() => {
      const parsedSchemas = [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].flatMap((node) => {
        try {
          const value = JSON.parse(node.textContent || "null");
          return Array.isArray(value) ? value : [value];
        } catch {
          return [{ invalidJsonLd: true }];
        }
      });
      return {
        title: document.title,
        description:
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") || "",
        canonical:
          document
            .querySelector('link[rel="canonical"]')
            ?.getAttribute("href") || "",
        ogUrl:
          document
            .querySelector('meta[property="og:url"]')
            ?.getAttribute("content") || "",
        robots:
          document
            .querySelector('meta[name="robots"]')
            ?.getAttribute("content") || "",
        googlebot:
          document
            .querySelector('meta[name="googlebot"]')
            ?.getAttribute("content") || "",
        h1Count: document.querySelectorAll("h1").length,
        mainWords: (document.querySelector("main")?.textContent || "")
          .trim()
          .split(/\s+/u)
          .filter(Boolean).length,
        mainText: (document.querySelector("main")?.textContent || "")
          .replace(/\s+/gu, " ")
          .trim(),
        h2Texts: [...document.querySelectorAll("main h2")].map(
          (heading) => heading.textContent?.replace(/\s+/gu, " ").trim() || "",
        ),
        cardRoutes: [...document.querySelectorAll("main article")].map(
          (card) => {
            const href =
              card.querySelector("a[href]")?.getAttribute("href") || "";
            return href ? new URL(href, location.origin).pathname : "";
          },
        ),
        schemas: parsedSchemas,
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        brokenImages: [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
        cls: window.__task14Cls || 0,
        links: [...document.querySelectorAll("a[href]")].map(
          (link) => link.getAttribute("href") || "",
        ),
        phoneLinks: [...document.querySelectorAll('a[href^="tel:"]')].map(
          (link) => link.getAttribute("href"),
        ),
        zaloLinks: [...document.querySelectorAll("a[href]")]
          .map((link) => link.getAttribute("href") || "")
          .filter((href) => href.includes("zalo.me")),
      };
    });

    const expected = getListingIndexability(listing.state.published.length, {
      hasStandaloneContent: listing.hasStandaloneContent,
    });
    const expectedCanonical = `${siteUrl}${listing.route}`;
    const rawResponse = await directRequest(listing.route);
    const rawMetadata = pageMetadata(rawResponse.body);
    if (rawResponse.status !== 200 || rawResponse.location)
      errors.push(`${listing.route}: HTTP phải là 200 trực tiếp.`);
    if (response?.status() !== 200 || response?.request().redirectedFrom())
      errors.push(`${listing.route}: browser không nhận 200 trực tiếp.`);
    if (dom.canonical !== expectedCanonical || dom.ogUrl !== expectedCanonical)
      errors.push(
        `${listing.route}: DOM canonical/og:url không self-canonical.`,
      );
    if (
      rawMetadata.canonicals.length !== 1 ||
      rawMetadata.canonicals[0]?.href !== expectedCanonical
    )
      errors.push(`${listing.route}: raw HTML canonical không đúng.`);
    if (
      rawMetadata.openGraphUrls.length !== 1 ||
      rawMetadata.openGraphUrls[0]?.content !== expectedCanonical
    )
      errors.push(`${listing.route}: raw HTML og:url không đúng.`);
    checkRobots(`${listing.route} DOM`, dom.robots, expected.index);
    checkRobots(
      `${listing.route} raw HTML`,
      rawMetadata.robots[0]?.content || "",
      expected.index,
    );
    checkRobots(`${listing.route} googlebot`, dom.googlebot, expected.index);
    checkXRobots(listing.route, rawResponse.xRobotsTag, expected.index);
    if (dom.h1Count !== 1)
      errors.push(`${listing.route}: cần đúng một H1, nhận ${dom.h1Count}.`);
    if (dom.cardRoutes.length !== listing.state.published.length)
      errors.push(
        `${listing.route}: card count ${dom.cardRoutes.length} không khớp published count ${listing.state.published.length}.`,
      );
    if (listing.state.published.length === 0 && listing.emptyHeading) {
      if (!dom.h2Texts.includes(listing.emptyHeading)) {
        errors.push(
          `${listing.route}: empty state phải hiển thị heading '${listing.emptyHeading}'.`,
        );
      }
      if (/(?:^|\s)404(?:\s|$)|không tìm thấy trang/iu.test(dom.mainText)) {
        errors.push(
          `${listing.route}: empty state không được dùng wording soft-404.`,
        );
      }
    }

    const expectedCardRoutes = listing.state.published
      .map((entry) => `${listing.detailPrefix}${entry.slug}/`)
      .sort();
    if (
      JSON.stringify([...new Set(dom.cardRoutes)].sort()) !==
      JSON.stringify(expectedCardRoutes)
    ) {
      errors.push(
        `${listing.route}: rendered cards không khớp published source.`,
      );
    }
    const typedSchemas = dom.schemas.flatMap((schema) => schemaObjects(schema));
    const itemLists = typedSchemas.filter(
      (schema) => schema["@type"] === "ItemList",
    );
    const fakeContentTypes = typedSchemas.filter((schema) =>
      ["Article", "BlogPosting", "CreativeWork", "Project"].includes(
        schema["@type"],
      ),
    );
    if (
      listing.state.published.length === 0 &&
      (itemLists.length || fakeContentTypes.length)
    ) {
      errors.push(`${listing.route}: empty listing chứa schema item giả.`);
    }
    for (const itemList of itemLists) {
      if (
        (itemList.itemListElement || []).length !==
        listing.state.published.length
      )
        errors.push(
          `${listing.route}: ItemList count không khớp published count.`,
        );
    }
    if (dom.overflow > 0)
      errors.push(
        `${listing.route} ${viewport.name}: page overflow ${dom.overflow}px.`,
      );
    if (dom.cls > 0.1)
      errors.push(
        `${listing.route} ${viewport.name}: CLS ${dom.cls} vượt 0.1.`,
      );
    if (dom.brokenImages.length)
      errors.push(
        `${listing.route} ${viewport.name}: broken images ${dom.brokenImages.join(", ")}.`,
      );
    if (consoleErrors.length || pageErrors.length || failedRequests.length) {
      errors.push(
        `${listing.route} ${viewport.name}: runtime errors console=${consoleErrors.length}, page=${pageErrors.length}, request=${failedRequests.length}.`,
      );
    }
    if (!dom.phoneLinks.includes(`tel:${business.phoneE164}`))
      errors.push(`${listing.route}: thiếu phone CTA hiện hành.`);
    if (!dom.zaloLinks.includes(business.zaloUrl))
      errors.push(`${listing.route}: thiếu Zalo CTA hiện hành.`);

    for (const href of dom.links) {
      if (!href || /^(?:mailto:|tel:|javascript:)/iu.test(href)) continue;
      const parsed = new URL(href, origin);
      if (parsed.origin !== new URL(origin).origin) continue;
      if (
        parsed.pathname !== "/" &&
        !parsed.pathname.endsWith("/") &&
        !path.posix.extname(parsed.pathname)
      ) {
        errors.push(
          `${listing.route}: internal link thiếu trailing slash (${href}).`,
        );
      }
      internalRoutes.add(parsed.pathname);
    }

    if (screenshotDirectory) {
      const slug = listing.route.replaceAll("/", "") || "home";
      await page.screenshot({
        path: path.join(
          screenshotDirectory,
          `${runtimeLabel}-${slug}-${viewport.name}.png`,
        ),
        fullPage: true,
      });
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
      schemaTypes: [
        ...new Set(
          typedSchemas.map((schema) => schema["@type"]).filter(Boolean),
        ),
      ],
      emptyStateVisible:
        listing.state.published.length === 0 &&
        Boolean(listing.emptyHeading) &&
        dom.h2Texts.includes(listing.emptyHeading),
      overflow: dom.overflow,
      cls: dom.cls,
      brokenImages: dom.brokenImages.length,
      runtimeErrors:
        consoleErrors.length + pageErrors.length + failedRequests.length,
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
    errors.push(
      `${route}: internal link redirect (${response.status}, ${response.location || "-"}).`,
    );
  } else if (response.status >= 400) {
    internalErrors += 1;
    errors.push(`${route}: internal link trả ${response.status}.`);
  }
}

const summary = {
  runtime: runtimeLabel,
  source: {
    articles: {
      total: articleState.total,
      published: articleState.published.length,
      drafts: articleState.drafts.length,
      invalid: articleState.invalid.length,
      excludedNoindex: articleState.excludedNoindex.length,
    },
    projects: {
      total: projectState.total,
      published: projectState.published.length,
      drafts: projectState.drafts.length,
      invalid: projectState.invalid.length,
      excludedNoindex: projectState.excludedNoindex.length,
    },
  },
  sitemap: {
    count: sitemapUrls.length,
    noindexUrls: sitemapNoindexUrls,
    redirects: sitemapRedirects,
  },
  internalLinks: { redirects: internalRedirects, errors: internalErrors },
  quoteApp: quoteManifest,
  metrics,
};

if (errors.length) {
  console.error(
    `Empty listing indexability validation thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`,
  );
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("Empty listing indexability validation pass.");
console.log(JSON.stringify(summary, null, 2));
