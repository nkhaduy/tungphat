import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "out");
if (!fs.existsSync(out)) { console.error("Thiếu thư mục out. Hãy chạy npm run build trước validate:links."); process.exit(1); }
function walk(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]); }
const htmlFiles = walk(out).filter((file) => file.endsWith(".html"));
const errors = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/\shref=["']([^"']+)["']/g)) {
    const href = match[1];
    if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/") || href.startsWith("/_next/")) continue;
    const clean = href.split(/[?#]/)[0];
    if (!clean) continue;
    const candidate = clean.endsWith("/") ? path.join(out, clean, "index.html") : path.join(out, clean, "index.html");
    const direct = path.join(out, clean);
    if (!fs.existsSync(candidate) && !fs.existsSync(direct)) errors.push(`${path.relative(out, file)} → ${href}`);
  }
}
if (errors.length) { console.error(`Internal link check thất bại (${errors.length}):\n- ${[...new Set(errors)].join("\n- ")}`); process.exit(1); }
console.log(`Internal link check pass: ${htmlFiles.length} trang HTML.`);
