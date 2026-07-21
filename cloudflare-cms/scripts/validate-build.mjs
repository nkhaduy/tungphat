import { existsSync, readFileSync } from "node:fs";
import { parse } from "yaml";

const requiredFiles = [
  "public/index.html", "public/admin-bootstrap.js", "public/admin-shell.js", "public/admin-shell.css",
  "public/config.yml", "public/cms-guard.js", "public/preview.js",
  "public/analytics/styles.css", "public/analytics/dashboard.js",
  "public/_routes.json",
  "functions/health.ts", "functions/api/auth/csrf.ts", "functions/api/auth/login.ts",
  "functions/api/auth/session.ts", "functions/api/auth/logout.ts", "functions/api/gateway/status.ts",
  "functions/git-gateway/github/[[path]].ts", "functions/api/contact.ts", "functions/api/quote.ts",
  "functions/api/analytics/track.ts", "functions/api/admin/analytics/[[path]].ts",
  "migrations/0005_create_cms_auth.sql",
  "migrations/0006_create_cms_git_objects.sql"
];
for (const file of requiredFiles) {
  if (!existsSync(new URL(`../${file}`, import.meta.url))) throw new Error(`Thiếu CMS build input: ${file}`);
}
const config = parse(readFileSync(new URL("../public/config.yml", import.meta.url), "utf8"));
if (!Array.isArray(config.collections) || config.collections.length < 5) throw new Error("CMS collections chưa đầy đủ.");
if (config.publish_mode !== "simple") throw new Error("CMS không ở direct publishing mode.");
console.log("Cloudflare CMS static build pass: assets và collections đầy đủ.");
