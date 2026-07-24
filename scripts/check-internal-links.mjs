import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PUBLIC_ORIGIN = "https://mdftungphat.com";
export const REDIRECT_STATUSES = new Set([301, 302, 307, 308]);

const ASSET_PREFIXES = ["/images/", "/icons/", "/fonts/", "/_next/"];
const EXCLUDED_ROUTE_PREFIXES = ["/api", "/cms-preview", "/admin"];
const FILE_EXTENSION = /\.[a-z0-9]{1,10}$/i;
const SIGNED_QUERY_KEYS = [
  "x-amz-signature",
  "x-goog-signature",
  "signature",
  "cloudfront-signature"
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function decodeHtmlAttribute(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? decodeHtmlAttribute(match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function hasAttribute(tag, name) {
  return new RegExp(`\\s${name}(?:\\s|=|>)`, "i").test(tag);
}

function hasExcludedPrefix(pathname) {
  return EXCLUDED_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isSignedUrl(url) {
  const keys = new Set([...url.searchParams.keys()].map((key) => key.toLowerCase()));
  return SIGNED_QUERY_KEYS.some((key) => keys.has(key));
}

export function classifyNavigationalHref({ rawHref, sourcePath = "/", anchorTag = "" }) {
  const href = rawHref.trim();
  if (!href || href.startsWith("#")) return { kind: "skip", reason: "empty-or-fragment-only" };
  if (/^(?:mailto|tel|sms|javascript|data|blob):/i.test(href)) return { kind: "skip", reason: "special-scheme" };
  if (hasAttribute(anchorTag, "download")) return { kind: "skip", reason: "download" };

  let url;
  try {
    url = new URL(href, new URL(sourcePath, PUBLIC_ORIGIN));
  } catch {
    return { kind: "skip", reason: "invalid-url" };
  }

  if (!/^https?:$/.test(url.protocol)) return { kind: "skip", reason: "non-http" };
  if (url.hostname.toLowerCase() !== new URL(PUBLIC_ORIGIN).hostname) return { kind: "skip", reason: "external" };
  if (ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return { kind: "skip", reason: "asset" };
  if (hasExcludedPrefix(url.pathname)) return { kind: "skip", reason: "api-or-admin" };
  if (FILE_EXTENSION.test(url.pathname)) return { kind: "skip", reason: "file" };
  if (isSignedUrl(url)) return { kind: "skip", reason: "signed-url" };

  return {
    kind: "internal",
    url,
    resolvedTarget: url.toString(),
    requestPath: `${url.pathname}${url.search}`,
    invalidTrailingSlash: url.pathname !== "/" && !url.pathname.endsWith("/")
  };
}

export function extractNavigationalLinks(html, sourcePath) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const anchorTag = match[0];
    const rawHref = attribute(anchorTag, "href");
    if (rawHref === null) continue;
    const classification = classifyNavigationalHref({ rawHref, sourcePath, anchorTag });
    if (classification.kind === "internal") links.push({ rawHref, ...classification });
  }
  return links;
}

function sourcePathForHtml(outputDirectory, file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative}`;
}

function safeOutputFile(outputDirectory, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relative = decoded.replace(/^\/+/, "");
  const resolved = path.resolve(outputDirectory, relative);
  const root = `${path.resolve(outputDirectory)}${path.sep}`;
  return resolved === path.resolve(outputDirectory) || resolved.startsWith(root) ? resolved : null;
}

function createOutputServer(outputDirectory) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const requestedFile = safeOutputFile(outputDirectory, requestUrl.pathname);
    if (!requestedFile) {
      response.writeHead(400).end("Bad request");
      return;
    }

    if (requestUrl.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(fs.readFileSync(path.join(outputDirectory, "index.html")));
      return;
    }

    if (!requestUrl.pathname.endsWith("/") && !FILE_EXTENSION.test(requestUrl.pathname)) {
      const indexFile = path.join(requestedFile, "index.html");
      if (fs.existsSync(indexFile)) {
        response.writeHead(308, { Location: `${requestUrl.pathname}/${requestUrl.search}` }).end();
        return;
      }
    }

    const file = requestUrl.pathname.endsWith("/") ? path.join(requestedFile, "index.html") : requestedFile;
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
    response.end(fs.readFileSync(file));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Không thể xác định cổng local link validator."));
        return;
      }
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function requestTargets(requestPaths, origin) {
  const results = new Map();
  await Promise.all([...requestPaths].map(async (requestPath) => {
    const requestUrl = new URL(requestPath, origin);
    try {
      const response = await fetch(requestUrl, { redirect: "manual" });
      results.set(requestPath, {
        status: response.status,
        location: response.headers.get("location"),
        error: null
      });
    } catch (error) {
      results.set(requestPath, {
        status: 0,
        location: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }));
  return results;
}

function relationshipKey(link) {
  return `${link.source}\u0000${link.resolvedTarget}`;
}

function uniqueRelationships(links) {
  const relationships = new Map();
  for (const link of links) {
    const key = relationshipKey(link);
    const existing = relationships.get(key);
    if (existing) existing.occurrences += 1;
    else relationships.set(key, { ...link, occurrences: 1 });
  }
  return [...relationships.values()];
}

function formatIssue(link) {
  const problems = [];
  if (REDIRECT_STATUSES.has(link.status)) problems.push("redirect");
  if (link.status >= 400 || link.status === 0) problems.push("HTTP error");
  if (link.invalidTrailingSlash) problems.push("missing trailing slash");
  return [
    `Source: ${link.source}`,
    `Raw href: ${link.rawHref}`,
    `Resolved target: ${link.resolvedTarget}`,
    `Status: ${link.status}${link.error ? ` (${link.error})` : ""}`,
    `Location: ${link.location ?? "-"}`,
    `Problems: ${problems.join(", ")}`
  ].join("\n  ");
}

export async function validateInternalLinks({ outputDirectory = path.join(process.cwd(), "out"), origin = process.env.LINK_CHECK_ORIGIN } = {}) {
  if (!fs.existsSync(outputDirectory)) throw new Error("Thiếu thư mục out. Hãy chạy npm run build trước validate:links.");

  const htmlFiles = walk(outputDirectory).filter((file) => file.endsWith(".html")).sort();
  const occurrences = htmlFiles.flatMap((file) => {
    const source = sourcePathForHtml(outputDirectory, file);
    const html = fs.readFileSync(file, "utf8");
    return extractNavigationalLinks(html, source).map((link) => ({ ...link, source, file }));
  });

  let localServer;
  let checkOrigin = origin;
  if (!checkOrigin) {
    localServer = await createOutputServer(outputDirectory);
    checkOrigin = localServer.origin;
  }

  try {
    const requestResults = await requestTargets(new Set(occurrences.map((link) => link.requestPath)), checkOrigin);
    const checkedOccurrences = occurrences.map((link) => ({ ...link, ...requestResults.get(link.requestPath) }));
    const relationships = uniqueRelationships(checkedOccurrences);
    const issues = relationships.filter((link) =>
      REDIRECT_STATUSES.has(link.status)
      || link.status >= 400
      || link.status === 0
      || link.invalidTrailingSlash
    );
    const redirectRelationships = relationships.filter((link) => REDIRECT_STATUSES.has(link.status));
    const errorRelationships = relationships.filter((link) => link.status >= 400 || link.status === 0);
    const invalidTrailingSlashRelationships = relationships.filter((link) => link.invalidTrailingSlash);
    const uniqueTargets = new Set(occurrences.map((link) => link.resolvedTarget));
    const uniqueRedirectTargets = new Set(redirectRelationships.map((link) => link.resolvedTarget));

    const summary = {
      htmlPages: htmlFiles.length,
      internalLinkOccurrences: occurrences.length,
      sourceTargetRelationships: relationships.length,
      uniqueTargets: uniqueTargets.size,
      redirectRelationships: redirectRelationships.length,
      uniqueRedirectTargets: uniqueRedirectTargets.size,
      errorRelationships: errorRelationships.length,
      invalidTrailingSlashRelationships: invalidTrailingSlashRelationships.length,
      issues
    };

    if (issues.length > 0) {
      console.error(`Internal link validation thất bại (${issues.length} quan hệ):\n\n${issues.map(formatIssue).join("\n\n")}`);
      console.error(`\nTổng: ${summary.htmlPages} HTML; ${summary.internalLinkOccurrences} internal links; ${summary.sourceTargetRelationships} quan hệ; ${summary.redirectRelationships} redirect; ${summary.errorRelationships} HTTP 4xx/5xx; ${summary.invalidTrailingSlashRelationships} thiếu trailing slash.`);
      return { ok: false, ...summary };
    }

    console.log(`Internal link validation pass: ${summary.htmlPages} HTML; ${summary.internalLinkOccurrences} internal links; ${summary.sourceTargetRelationships} quan hệ; ${summary.uniqueTargets} target; 0 redirect; 0 HTTP 4xx/5xx; 0 thiếu trailing slash.`);
    return { ok: true, ...summary };
  } finally {
    if (localServer) await new Promise((resolve) => localServer.server.close(resolve));
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  validateInternalLinks()
    .then((result) => {
      if (!result.ok) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
