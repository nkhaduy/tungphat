import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";
import { decodeHTML } from "entities";

const output = path.resolve("out");
const reports = path.resolve("reports");
const origin = process.env.SEO_SITE_URL ?? "https://mdftungphat.com";
const maxBytes = 18_000;
const errors = [];

function requireFile(file) {
  if (!existsSync(file)) {
    throw new Error(`Chưa có ${file}. Chạy npm run build trước khi kiểm tra llms.txt.`);
  }
  return readFileSync(file);
}

function utf8(buffer) {
  return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
}

function stripMarkup(value) {
  return decodeHTML(value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]*>/gu, " "))
    .replace(/\s+/gu, " ")
    .trim();
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "iu"));
  return decodeHTML(match?.[1] ?? match?.[2] ?? "");
}

function pageInfo(html, url) {
  const title = stripMarkup(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1] ?? "");
  const h1 = stripMarkup(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu)?.[1] ?? "");
  const main = stripMarkup(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/iu)?.[1] ?? "").slice(0, 500);
  const links = [...html.matchAll(/<link\b[^>]*>/giu)].map(([tag]) => tag);
  const meta = [...html.matchAll(/<meta\b[^>]*>/giu)].map(([tag]) => tag);
  const canonical = links.find((tag) => attribute(tag, "rel").toLowerCase() === "canonical");
  const robots = meta.filter((tag) => attribute(tag, "name").toLowerCase() === "robots")
    .map((tag) => attribute(tag, "content"));
  const indexable = Boolean(canonical) && attribute(canonical, "href") === url &&
    !robots.some((value) => /\bnoindex\b/iu.test(value));
  return { title, h1, main, indexable, canonical: canonical ? attribute(canonical, "href") : "" };
}

function typeOf(url) {
  const pathname = new URL(url).pathname;
  if (pathname.startsWith("/catalogue/")) return "catalogue";
  if (pathname.startsWith("/bai-viet/")) return "article";
  if (pathname.startsWith("/du-an/")) return "project";
  if (pathname.startsWith("/chi-nhanh/")) return "location";
  if (pathname === "/") return "home";
  if (["/gia-cong-cnc/", "/cat-cnc-go/", "/gia-cong-cnc-mdf/"].includes(pathname)) return "service";
  if (["/lien-he/", "/bao-gia/"].includes(pathname)) return "contact";
  return "content-or-utility";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const llmsBytes = requireFile(path.join(output, "llms.txt"));
const markdown = utf8(llmsBytes);
if (llmsBytes.length > maxBytes) errors.push(`llms.txt vượt ${maxBytes} bytes`);
if (markdown.includes("\uFFFD")) errors.push("llms.txt có replacement character (lỗi encoding)");
if ((markdown.match(/^# /gmu) ?? []).length !== 1) errors.push("llms.txt phải có đúng một H1");
if ((markdown.match(/^## /gmu) ?? []).length < 6) errors.push("llms.txt thiếu các nhóm chủ đề H2");
if (!markdown.startsWith("# MDF Tùng Phát")) errors.push("llms.txt thiếu brand H1");
if (!markdown.includes("https://zalo.me/0909259160")) errors.push("Thiếu Zalo chính thức trong llms.txt");
if (/https?:\/\/(?:localhost|127\.0\.0\.1|[^\s/)]*staging)/iu.test(markdown)) {
  errors.push("llms.txt chứa URL local/staging");
}

const sitemap = utf8(requireFile(path.join(output, "sitemap.xml")));
const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/gu)].map((match) => ({
  url: decodeHTML(match[1]),
  lastmod: match[2].match(/<lastmod>([^<]+)<\/lastmod>/u)?.[1] ?? "",
}));
const sitemapUrls = new Set(sitemapEntries.map(({ url }) => url));
const selected = new Map();
for (const line of markdown.split("\n").filter((value) => value.startsWith("- "))) {
  const match = line.match(/^- \[([^\]]+)\]\((https:\/\/[^)]+)\): (.+)$/u);
  if (!match) {
    errors.push(`Markdown link sai định dạng: ${line.slice(0, 140)}`);
    continue;
  }
  const [, label, url, description] = match;
  let parsed;
  try { parsed = new URL(url); } catch {
    errors.push(`URL không hợp lệ: ${url}`);
    continue;
  }
  if (!label.trim() || !description.trim()) errors.push(`Link thiếu nhãn hoặc mô tả: ${url}`);
  if (selected.has(url)) errors.push(`Link trùng trong llms.txt: ${url}`);
  selected.set(url, { label, description });
  if (parsed.search || parsed.hash) errors.push(`Link chứa query/fragment: ${url}`);
  if (parsed.origin === origin && !sitemapUrls.has(url) &&
      ![`${origin}/sitemap.xml`, `${origin}/knowledge.json`].includes(url)) {
    errors.push(`URL trong llms.txt không nằm trong sitemap: ${url}`);
  }
  if (parsed.origin !== origin && url !== "https://zalo.me/0909259160") {
    errors.push(`Link ngoài domain chưa được duyệt: ${url}`);
  }
}

const inventory = [];
for (const { url, lastmod } of sitemapEntries) {
  const parsed = new URL(url);
  if (parsed.origin !== origin || parsed.search || parsed.hash) {
    errors.push(`URL sitemap không canonical: ${url}`);
    continue;
  }
  const route = decodeURIComponent(parsed.pathname).replace(/^\/+|\/+$/gu, "");
  const file = path.join(output, route, "index.html");
  if (!existsSync(file)) {
    errors.push(`Sitemap có URL chưa export: ${url}`);
    continue;
  }
  const info = pageInfo(utf8(readFileSync(file)), url);
  const included = selected.has(url);
  if (included && (!info.indexable || !info.title || !info.h1 || !info.main)) {
    errors.push(`Link llms.txt không có bằng chứng nội dung/indexability: ${url}`);
  }
  const topic = typeOf(url);
  inventory.push({ url, topic, ...info, lastmod, included,
    priority: included ? "high" : topic === "catalogue" ? "on-demand" : "not-curated" });
}

for (const url of selected.keys()) {
  if (url.startsWith(`${origin}/`) && sitemapUrls.has(url) &&
      !inventory.some((entry) => entry.url === url)) {
    errors.push(`Không có HTML export cho ${url}`);
  }
}

mkdirSync(reports, { recursive: true });
const columns = ["canonical_url", "page_type", "title", "h1", "published_in_sitemap", "indexable", "topic", "main_content_excerpt", "sitemap_lastmod", "llms_priority", "included_in_llms"];
const rows = inventory.map((entry) => [entry.url, entry.topic, entry.title, entry.h1, "yes", entry.indexable ? "yes" : "no", entry.topic,
  entry.main, entry.lastmod, entry.priority, entry.included ? "yes" : "no"]);
writeFileSync(path.join(reports, "llms-url-inventory.csv"), [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n");
const types = Object.fromEntries([...new Set(inventory.map((entry) => entry.topic))].sort().map((topic) => {
  const pages = inventory.filter((entry) => entry.topic === topic);
  return [topic, { checked: pages.length, included: pages.filter((entry) => entry.included).length }];
}));
const coverage = {
  sitemapUrls: sitemapUrls.size,
  inspectedHtml: inventory.length,
  indexableHtml: inventory.filter((page) => page.indexable).length,
  curatedInternalUrls: inventory.filter((page) => page.included).length,
  excludedFromCurated: inventory.filter((page) => !page.included).length,
  auxiliaryLinks: [...selected.keys()].filter((url) => !sitemapUrls.has(url)),
  llmsBytes: llmsBytes.length,
  types,
  errors,
};
writeFileSync(path.join(reports, "llms-coverage.json"), JSON.stringify(coverage, null, 2) + "\n");
console.log(JSON.stringify(coverage, null, 2));
if (errors.length) process.exitCode = 1;
