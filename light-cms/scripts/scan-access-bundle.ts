import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const forbiddenMarkers = ["PBKDF2", "/api/auth/login", "tp_light_session"] as const;

export function scanAccessBundleText(value: string) {
  return forbiddenMarkers.filter((marker) => value.includes(marker));
}

function filesAt(target: string): string[] {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(target, entry.name);
    return entry.isDirectory() ? filesAt(fullPath) : entry.isFile() && /\.(?:js|mjs|html)$/u.test(entry.name) ? [fullPath] : [];
  });
}

export function scanAccessBundlePaths(targets: string[]) {
  return targets.flatMap((target) => filesAt(target).flatMap((file) => scanAccessBundleText(fs.readFileSync(file, "utf8")).map((marker) => ({ file, marker }))));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) throw new Error("Provide at least one Worker or SPA bundle path");
  const findings = scanAccessBundlePaths(targets);
  if (findings.length > 0) {
    console.error(JSON.stringify({ ok: false, findings }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ ok: true, files: targets }, null, 2));
  }
}
