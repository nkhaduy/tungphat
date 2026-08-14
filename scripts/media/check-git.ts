import { execFileSync } from "node:child_process";

const FORBIDDEN_PREFIXES = [
  "public/catalog/",
  "data/imports/ancuong/media/",
  "data/imports/an-cuong/media/",
  "data/imports/ba-thanh/media/",
  "data/imports/thanh-thuy/media/",
];

export function forbiddenTrackedMedia(files: string[]): string[] {
  return files.filter((file) => FORBIDDEN_PREFIXES.some((prefix) => file.startsWith(prefix))).sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tracked = execFileSync("git", ["ls-files", "-z"]).toString("utf8").split("\0").filter(Boolean);
  const forbidden = forbiddenTrackedMedia(tracked);
  if (forbidden.length) {
    console.error(`Generated media must not be tracked by Git (${forbidden.length} files).`);
    process.exitCode = 1;
  } else {
    console.log("Git media guard pass: no generated catalogue/crawl media is tracked.");
  }
}
