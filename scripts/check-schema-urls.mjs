import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const CANONICAL_ORIGIN = "https://mdftungphat.com";
const URL_KEYS = new Set([
  "@id",
  "contentUrl",
  "image",
  "item",
  "logo",
  "mainEntityOfPage",
  "sameAs",
  "thumbnailUrl",
  "url",
]);
const CURRENT_PAGE_TYPES = new Set([
  "Article",
  "CollectionPage",
  "ContactPage",
  "CreativeWork",
  "Product",
  "Service",
  "WebPage",
]);
const FILE_EXTENSION =
  /\.(?:avif|bmp|css|csv|eot|gif|ico|jpe?g|js|json|map|mjs|mp3|mp4|ogg|otf|pdf|png|svg|ttf|txt|webm|webp|woff2?|xml)$/iu;
const FORBIDDEN_SCHEMA_KEYS = new Set([
  "aggregaterating",
  "availability",
  "certification",
  "offer",
  "offers",
  "price",
  "pricecurrency",
  "rating",
  "review",
  "serviceoutput",
]);

const EXPECTED = {
  metadataHash:
    "157d948ff3af33d98c9290d2bb4ed4b4f7379fb9314a75c909f6f2a4a463b9f2",
  visibleTextHash:
    "1f1433ac02361bb021ec5d796f0083d002790276dc8cd4afa32499cf90e39aff",
  schemaShapeHash:
    "c2225de70ae6d94d6f24598755bc43b762713409cab389f134122c5fdeaff4ef",
  schemaTypeHash:
    "1e35135eee6e55bcfa9116ed6acbf11bbc2650bddd39a878009e29f14a6f8cc9",
  externalUrlHash:
    "bb35f131f3a1a05afbd47f477642f63e9868cef656973877d7d96c372eb524c8",
  assetUrlHash:
    "5369b1e28867947f6afb1f629ec1aa1e4fd2b3cc7364611a1c6d9e272f088d2e",
  sitemapHash:
    "0e9bdd0d780ca4f36d8930309345c3e0734f7f1ce345f643d1439c8218376a0d",
  protectedFileHash:
    "d2ee155005687638daf3a5f8ba2b4e16fa36757473e46bcc9e13676adecd59c8",
  quoteApp: {
    fileCount: 0,
    bytes: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
};

const PROTECTED_FILES = [
  "app/page.tsx",
  "components/site/SiteFooter.tsx",
  "components/site/SiteHeader.tsx",
  "components/ui/PageHero.tsx",
  "components/Partners.tsx",
  "components/WorkshopMedia.tsx",
  "content/pages/cat-cnc-go.md",
  "content/pages/gia-cong-cnc-mdf.md",
  "content/products/go-ghep-cao-su.md",
  "content/products/go-ghep-tram.md",
  "content/products/go-ghep.md",
  "content/products/mdf-chong-am.md",
  "content/products/van-go-cong-nghiep.md",
  "content/products/van-mdf.md",
];

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const outputDirectory = path.resolve(option("--out") ?? "out");
const runtimeOrigin = option("--origin");
const runtimeLabel =
  option("--label") ?? (runtimeOrigin ? "runtime" : "static export");
const snapshotOnly = process.argv.includes("--snapshot");
const jsonOutput = process.argv.includes("--json");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableHash(records) {
  return sha256(records.slice().sort().join("\n"));
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

function htmlRoute(file) {
  const relative = path
    .relative(outputDirectory, file)
    .split(path.sep)
    .join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html"))
    return `/${relative.slice(0, -"/index.html".length)}/`;
  return `/${relative}`;
}

function publicHtmlFiles() {
  if (!existsSync(outputDirectory))
    throw new Error(`Không tìm thấy static export: ${outputDirectory}`);
  return walkFiles(outputDirectory)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => !["/404.html", "/404/"].includes(htmlRoute(file)))
    .sort();
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

function pageMetadata(html) {
  const links = [...html.matchAll(/<link\b[^>]*>/giu)].map((match) =>
    attributes(match[0]),
  );
  const metas = [...html.matchAll(/<meta\b[^>]*>/giu)].map((match) =>
    attributes(match[0]),
  );
  const title = decodeHtml(
    html.match(/<title>([\s\S]*?)<\/title>/iu)?.[1]?.trim() ?? "",
  );
  return {
    title,
    canonical:
      links.find((tag) => tag.rel?.toLowerCase() === "canonical")?.href ?? "",
    robots:
      metas.find((tag) => tag.name?.toLowerCase() === "robots")?.content ?? "",
  };
}

function visibleText(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/iu)?.[1] ?? "";
  return decodeHtml(
    body
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<[^>]+>/gu, " ")
      .replace(/\s+/gu, " ")
      .trim(),
  );
}

function jsonLdBlocks(html) {
  return [
    ...html.matchAll(
      /<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu,
    ),
  ].map((match) => match[1]);
}

function internalHtmlLinks(html, route) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*>/giu)) {
    const href = attributes(match[0]).href?.trim();
    if (
      !href ||
      href.startsWith("#") ||
      /^(?:javascript|mailto|tel):/iu.test(href)
    )
      continue;
    let url;
    try {
      url = new URL(href, new URL(route, CANONICAL_ORIGIN));
    } catch {
      continue;
    }
    if (
      !isInternalHostname(url.hostname) ||
      isFilePath(url.pathname) ||
      url.pathname.startsWith("/api/")
    )
      continue;
    links.push({ href, url });
  }
  return links;
}

function isInternalHostname(hostname) {
  return hostname === "mdftungphat.com" || hostname === "www.mdftungphat.com";
}

function parsedAbsoluteUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isFilePath(pathname) {
  return FILE_EXTENSION.test(pathname.replace(/\/$/u, ""));
}

function schemaShape(value) {
  if (Array.isArray(value)) return value.map(schemaShape);
  if (!value || typeof value !== "object") {
    if (typeof value !== "string") return value;
    const url = parsedAbsoluteUrl(value);
    return url && isInternalHostname(url.hostname) ? "<internal-url>" : value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, schemaShape(child)]),
  );
}

function inspectSchema(value, context, result) {
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      inspectSchema(
        child,
        { ...context, propertyPath: [...context.propertyPath, `[${index}]`] },
        result,
      ),
    );
    return;
  }
  if (!value || typeof value !== "object") return;

  const ownType =
    typeof value["@type"] === "string" ? value["@type"] : undefined;
  const nodeType = ownType ?? context.nodeType;
  const nodeRootDepth = ownType
    ? context.propertyPath.length
    : context.nodeRootDepth;
  if (ownType) {
    result.schemaNodes += 1;
    result.typeRecords.push(
      `${context.route}\t${context.block}\t${context.propertyPath.join(".")}\t${ownType}`,
    );
  }
  if (Object.keys(value).length === 0) {
    result.emptyObjects.push(
      `${context.route} block ${context.block} ${context.propertyPath.join(".")}`,
    );
  }

  for (const [key, child] of Object.entries(value)) {
    const propertyPath = [...context.propertyPath, key];
    const relativePath = propertyPath.slice(nodeRootDepth).join(".");
    const keyLower = key.toLowerCase();
    if (FORBIDDEN_SCHEMA_KEYS.has(keyLower)) {
      result.forbiddenFields.push(
        `${context.route}\t${nodeType ?? "(untyped)"}\t${propertyPath.join(".")}`,
      );
    }

    if (typeof child === "string") {
      const url = parsedAbsoluteUrl(child);
      if (url) {
        const record = {
          route: context.route,
          block: context.block,
          schemaType: nodeType ?? "(untyped)",
          property: propertyPath.join("."),
          relativeProperty: relativePath,
          key,
          value: child,
          url,
        };
        if (isInternalHostname(url.hostname)) result.internalUrls.push(record);
        else result.externalUrls.push(record);
      } else if (
        URL_KEYS.has(key) &&
        (/^\//u.test(child) || /^https?:/iu.test(child))
      ) {
        result.malformedUrlValues.push(
          `${context.route}\t${nodeType ?? "(untyped)"}\t${propertyPath.join(".")}\t${child}`,
        );
      }
    }

    inspectSchema(
      child,
      { ...context, nodeRootDepth, nodeType, propertyPath },
      result,
    );
  }
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

function protectedFileHash() {
  return stableHash(
    PROTECTED_FILES.map((file) => {
      const content = readFileSync(path.resolve(file));
      return `${sha256(content)}  ${file}`;
    }),
  );
}

function currentPageReference(record, canonical) {
  const canonicalUrl = parsedAbsoluteUrl(canonical);
  if (!canonicalUrl) return false;
  const recordBase = new URL(record.value);
  recordBase.hash = "";
  if (record.schemaType === "ListItem" && record.relativeProperty === "item") {
    return recordBase.pathname.replace(/\/?$/u, "/") === canonicalUrl.pathname;
  }
  return (
    CURRENT_PAGE_TYPES.has(record.schemaType) &&
    ["@id", "mainEntityOfPage", "url"].includes(record.relativeProperty)
  );
}

async function directResponse(record, cache) {
  if (!runtimeOrigin) return null;
  const requestUrl = new URL(record.value);
  requestUrl.hash = "";
  const localUrl = new URL(
    `${requestUrl.pathname}${requestUrl.search}`,
    runtimeOrigin,
  ).toString();
  if (!cache.has(localUrl)) {
    const response = await fetch(localUrl, { redirect: "manual" });
    cache.set(localUrl, {
      status: response.status,
      location: response.headers.get("location") ?? "",
    });
  }
  return cache.get(localUrl);
}

async function loadPages(files) {
  const pages = [];
  for (const file of files) {
    const route = htmlRoute(file);
    if (!runtimeOrigin) {
      pages.push({ route, html: readFileSync(file, "utf8") });
      continue;
    }
    const response = await fetch(new URL(route, runtimeOrigin), {
      redirect: "manual",
    });
    if (response.status !== 200)
      throw new Error(`${route}: runtime trả ${response.status}`);
    pages.push({ route, html: await response.text() });
  }
  return pages;
}

const files = publicHtmlFiles();
const pages = await loadPages(files);
const result = {
  schemaNodes: 0,
  typeRecords: [],
  internalUrls: [],
  externalUrls: [],
  malformedUrlValues: [],
  forbiddenFields: [],
  emptyObjects: [],
};
const metadataRecords = [];
const visibleRecords = [];
const shapeRecords = [];
const htmlLinks = [];
const pageCanonicals = new Map();
let jsonLdBlockCount = 0;
let parseErrors = 0;

for (const { route, html } of pages) {
  const metadata = pageMetadata(html);
  pageCanonicals.set(route, metadata.canonical);
  metadataRecords.push(
    `${route}\t${metadata.title}\t${metadata.canonical}\t${metadata.robots}`,
  );
  visibleRecords.push(`${route}\t${visibleText(html)}`);
  htmlLinks.push(
    ...internalHtmlLinks(html, route).map((link) => ({ ...link, route })),
  );
  const blocks = jsonLdBlocks(html);
  jsonLdBlockCount += blocks.length;
  blocks.forEach((source, block) => {
    try {
      const schema = JSON.parse(source);
      shapeRecords.push(
        `${route}\t${block}\t${JSON.stringify(schemaShape(schema))}`,
      );
      inspectSchema(
        schema,
        {
          route,
          block,
          propertyPath: [],
          nodeRootDepth: 0,
          nodeType: undefined,
        },
        result,
      );
    } catch (error) {
      parseErrors += 1;
      result.malformedUrlValues.push(
        `${route}\tblock ${block}\tJSON parse: ${error.message}`,
      );
    }
  });
}

const runtimeCache = new Map();
const urlErrors = [];
let redirectingOccurrences = 0;
let httpErrorOccurrences = 0;
let canonicalMismatches = 0;
let malformedPageOccurrences = 0;
let malformedFragmentOccurrences = 0;
let assetSlashOccurrences = 0;

for (const record of result.internalUrls) {
  const { url } = record;
  const asset = isFilePath(url.pathname);
  const reasons = [];
  if (asset) {
    if (url.pathname.endsWith("/")) {
      reasons.push("slash-after-file-extension");
      assetSlashOccurrences += 1;
    }
  } else {
    if (url.origin !== CANONICAL_ORIGIN || url.protocol !== "https:")
      reasons.push("non-canonical-origin");
    if (!url.pathname.endsWith("/")) reasons.push("missing-trailing-slash");
    if (/\/{2,}/u.test(url.pathname)) reasons.push("double-slash-in-pathname");
    if (url.hash && !url.pathname.endsWith("/")) {
      reasons.push("fragment-before-trailing-slash");
      malformedFragmentOccurrences += 1;
    }
    if (
      reasons.some((reason) =>
        [
          "double-slash-in-pathname",
          "missing-trailing-slash",
          "non-canonical-origin",
        ].includes(reason),
      )
    ) {
      malformedPageOccurrences += 1;
    }

    const canonical = pageCanonicals.get(record.route) ?? "";
    if (currentPageReference(record, canonical)) {
      const base = new URL(record.value);
      base.hash = "";
      if (base.toString() !== canonical) {
        reasons.push("current-page-canonical-mismatch");
        canonicalMismatches += 1;
      }
    }

    const response = await directResponse(record, runtimeCache);
    if (response) {
      if (response.status >= 300 && response.status < 400) {
        reasons.push(`redirect-${response.status}`);
        redirectingOccurrences += 1;
      } else if (response.status >= 400) {
        reasons.push(`http-${response.status}`);
        httpErrorOccurrences += 1;
      } else if (response.status !== 200) {
        reasons.push(`non-200-${response.status}`);
        httpErrorOccurrences += 1;
      }
    }
  }
  if (reasons.length)
    urlErrors.push({
      ...record,
      url: undefined,
      reasons,
      response: await directResponse(record, runtimeCache),
    });
}

const internalAssetRecords = result.internalUrls
  .filter((record) => isFilePath(record.url.pathname))
  .map(
    (record) =>
      `${record.route}\t${record.block}\t${record.property}\t${record.value}`,
  );
const externalUrlRecords = result.externalUrls.map(
  (record) =>
    `${record.route}\t${record.block}\t${record.property}\t${record.value}`,
);
const hashes = {
  metadataHash: stableHash(metadataRecords),
  visibleTextHash: stableHash(visibleRecords),
  schemaShapeHash: stableHash(shapeRecords),
  schemaTypeHash: stableHash(result.typeRecords),
  externalUrlHash: stableHash(externalUrlRecords),
  assetUrlHash: stableHash(internalAssetRecords),
  sitemapHash: sha256(readFileSync(path.join(outputDirectory, "sitemap.xml"))),
  protectedFileHash: protectedFileHash(),
};
const quoteApp = quoteAppManifest();
const sitemapSource = readFileSync(
  path.join(outputDirectory, "sitemap.xml"),
  "utf8",
);
const sitemapUrls = [...sitemapSource.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(
  (match) => match[1],
);
let htmlLinkRedirects = 0;
let htmlLinkHttpErrors = 0;
let malformedHtmlLinks = 0;
let sitemapRedirects = 0;
let sitemapHttpErrors = 0;
const navigationCache = new Map();

async function validateNavigationalUrl(value) {
  const url = new URL(value, CANONICAL_ORIGIN);
  url.hash = "";
  if (url.pathname !== "/" && !url.pathname.endsWith("/"))
    malformedHtmlLinks += 1;
  if (!runtimeOrigin) return null;
  const local = new URL(
    `${url.pathname}${url.search}`,
    runtimeOrigin,
  ).toString();
  if (!navigationCache.has(local)) {
    const response = await fetch(local, { redirect: "manual" });
    navigationCache.set(local, response.status);
  }
  return navigationCache.get(local);
}

for (const link of htmlLinks) {
  const status = await validateNavigationalUrl(link.url);
  if (status >= 300 && status < 400) htmlLinkRedirects += 1;
  else if (status && status !== 200) htmlLinkHttpErrors += 1;
}
for (const value of sitemapUrls) {
  const status = await validateNavigationalUrl(value);
  if (status >= 300 && status < 400) sitemapRedirects += 1;
  else if (status && status !== 200) sitemapHttpErrors += 1;
}
const summary = {
  runtime: runtimeLabel,
  routes: pages.length,
  jsonLdBlocks: jsonLdBlockCount,
  schemaNodes: result.schemaNodes,
  internalUrlOccurrences: result.internalUrls.length,
  uniqueInternalUrls: new Set(result.internalUrls.map((record) => record.value))
    .size,
  redirectingOccurrences,
  httpErrorOccurrences,
  canonicalMismatches,
  malformedPageOccurrences,
  malformedFragmentOccurrences,
  assetSlashOccurrences,
  jsonParseErrors: parseErrors,
  malformedUrlValues: result.malformedUrlValues.length,
  emptyObjects: result.emptyObjects.length,
  forbiddenFields: result.forbiddenFields.length,
  htmlLinkOccurrences: htmlLinks.length,
  htmlLinkRedirects,
  htmlLinkHttpErrors,
  sitemapUrls: sitemapUrls.length,
  sitemapRedirects,
  sitemapHttpErrors,
};

if (snapshotOnly) {
  console.log(
    JSON.stringify({ summary, hashes, quoteApp, urlErrors }, null, 2),
  );
  process.exit(0);
}

const errors = [];
function check(condition, message) {
  if (!condition) errors.push(message);
}

check(parseErrors === 0, `JSON-LD parse errors: ${parseErrors}`);
check(
  result.emptyObjects.length === 0,
  `JSON-LD empty objects: ${result.emptyObjects.length}`,
);
check(
  result.malformedUrlValues.length === 0,
  `Malformed/relative schema URL values: ${result.malformedUrlValues.length}`,
);
check(
  malformedPageOccurrences === 0,
  `Internal page URL malformed: ${malformedPageOccurrences}`,
);
check(
  malformedFragmentOccurrences === 0,
  `Fragment before trailing slash: ${malformedFragmentOccurrences}`,
);
check(
  assetSlashOccurrences === 0,
  `Slash after file extension: ${assetSlashOccurrences}`,
);
check(
  redirectingOccurrences === 0,
  `Internal schema page redirects: ${redirectingOccurrences}`,
);
check(
  httpErrorOccurrences === 0,
  `Internal schema page HTTP errors: ${httpErrorOccurrences}`,
);
check(
  canonicalMismatches === 0,
  `Current-page canonical mismatches: ${canonicalMismatches}`,
);
check(
  result.forbiddenFields.length === 0,
  `Offer/price/rating/review/certification fields: ${result.forbiddenFields.length}`,
);
check(
  malformedHtmlLinks === 0,
  `Internal HTML links thiếu trailing slash: ${malformedHtmlLinks}`,
);
check(
  htmlLinkRedirects === 0,
  `Internal HTML link redirects: ${htmlLinkRedirects}`,
);
check(
  htmlLinkHttpErrors === 0,
  `Internal HTML link HTTP errors: ${htmlLinkHttpErrors}`,
);
check(
  new Set(sitemapUrls).size === sitemapUrls.length,
  `Sitemap duplicate URLs: ${sitemapUrls.length - new Set(sitemapUrls).size}`,
);
check(sitemapRedirects === 0, `Sitemap redirects: ${sitemapRedirects}`);
check(sitemapHttpErrors === 0, `Sitemap HTTP errors: ${sitemapHttpErrors}`);
for (const [key, expected] of Object.entries(EXPECTED)) {
  if (typeof expected !== "string") continue;
  if (runtimeOrigin && key === "visibleTextHash") continue;
  check(hashes[key] === expected, `${key} regression: ${hashes[key]}`);
}
check(
  JSON.stringify(quoteApp) === JSON.stringify(EXPECTED.quoteApp),
  `quote-app drift: ${JSON.stringify(quoteApp)}`,
);

const requiredTypes = new Map([
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
for (const [route, type] of requiredTypes) {
  check(
    result.typeRecords.some(
      (record) =>
        record.startsWith(`${route}\t`) && record.endsWith(`\t${type}`),
    ),
    `${route}: thiếu ${type}`,
  );
}

if (jsonOutput) {
  console.log(
    JSON.stringify({ summary, hashes, quoteApp, errors, urlErrors }, null, 2),
  );
} else {
  console.log(JSON.stringify(summary, null, 2));
  if (urlErrors.length) {
    console.error("Schema URL errors:");
    for (const error of urlErrors) {
      console.error(
        `- ${error.route} | ${error.schemaType} | ${error.property} | ${error.value} | ${error.reasons.join(", ")}`,
      );
    }
  }
  if (errors.length) {
    console.error("Schema URL validation failed:");
    for (const error of errors) console.error(`- ${error}`);
  } else {
    console.log(`Schema URL validation pass (${runtimeLabel}).`);
  }
}

if (errors.length) process.exit(1);
