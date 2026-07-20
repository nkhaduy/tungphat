import { existsSync, readFileSync } from "node:fs";
import { parse } from "yaml";

const requiredFiles = [
  "public/index.html", "public/config.yml", "public/cms-guard.js", "public/preview.js",
  "public/analytics/index.html", "public/analytics/styles.css", "public/analytics/dashboard.js",
  "public/_routes.json",
  "functions/auth.ts", "functions/callback.ts", "functions/health.ts",
  "functions/analytics/_middleware.ts", "functions/api/contact.ts", "functions/api/quote.ts",
  "functions/api/analytics/track.ts", "functions/api/admin/analytics/[[path]].ts"
];
for (const file of requiredFiles) {
  if (!existsSync(new URL(`../${file}`, import.meta.url))) throw new Error(`Thiếu CMS build input: ${file}`);
}
const config = parse(readFileSync(new URL("../public/config.yml", import.meta.url), "utf8"));
if (!Array.isArray(config.collections) || config.collections.length < 5) throw new Error("CMS collections chưa đầy đủ.");
if (config.publish_mode !== "simple") throw new Error("CMS không ở direct publishing mode.");
console.log("Cloudflare CMS static build pass: assets và collections đầy đủ.");
