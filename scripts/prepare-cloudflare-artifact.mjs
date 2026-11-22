import fs from "node:fs";

// Only the legacy same-origin media proxy invokes a Function. All HTML,
// search indexes, scripts, styles and images remain unmetered Pages assets.
fs.writeFileSync("out/_routes.json", `${JSON.stringify({ version: 1, include: ["/catalog/*"], exclude: [] }, null, 2)}\n`);
if (process.env.CLOUDFLARE_PREVIEW === "1" || (process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== "main")) {
  fs.appendFileSync("out/_headers", "\n/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n");
}
console.log("Cloudflare artifact prepared: only /catalog/* invokes a Function.");
