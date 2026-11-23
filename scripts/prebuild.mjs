import { spawnSync } from "node:child_process";

const preview = process.env.STATIC_BUILD_TARGET === "preview";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const node = process.execPath;
const tsx = process.platform === "win32" ? "node_modules/.bin/tsx.cmd" : "node_modules/.bin/tsx";
const commands = [
  [node, ["scripts/product-media/build-index.mjs"]],
  [npm, ["run", "sync:payload-build-data"]],
  ...(!preview ? [[node, ["scripts/sync-trustindex-reviews.mjs"]], [node, ["scripts/prepare-indexnow-key.mjs"]]] : []),
  [node, ["scripts/generate-material-reference.mjs"]],
  [node, ["scripts/generate-cnc-preflight.mjs"]],
  [tsx, ["scripts/catalog-suppliers/build-browser-index.ts"]],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (preview) console.log("Preview prebuild used repository snapshots and skipped production CMS/review/indexing secrets.");
