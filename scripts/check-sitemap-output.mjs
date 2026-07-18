import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve("out");
const sitemapPath = path.join(outputDirectory, "sitemap.xml");
const canonicalOrigin = "https://mdftungphat.com";

if (!existsSync(sitemapPath)) {
  console.error("Thiếu out/sitemap.xml. Hãy chạy npm run build trước khi kiểm tra sitemap.");
  process.exit(1);
}

const urls = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const errors = [];
for (const url of urls) {
  let parsed;
  try { parsed = new URL(url); } catch { errors.push(`URL sitemap không hợp lệ: ${url}`); continue; }
  if (parsed.origin !== canonicalOrigin) {
    errors.push(`Sitemap phải dùng canonical apex ${canonicalOrigin}: ${url}`);
    continue;
  }
  const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+|\/+$/g, "");
  const outputPath = pathname ? path.join(outputDirectory, pathname, "index.html") : path.join(outputDirectory, "index.html");
  if (!existsSync(outputPath)) errors.push(`Sitemap trỏ tới route không được export: ${parsed.pathname}`);
}

if (errors.length) {
  console.error(`Sitemap output validation thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Sitemap output validation pass: ${urls.length} URL canonical đều có HTML.`);
