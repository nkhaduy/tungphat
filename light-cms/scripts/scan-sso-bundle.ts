import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const forbiddenMarkers = [
  "Cf-Access-Jwt-Assertion",
  "ACCESS_AUD",
  "ACCESS_ISSUER",
  "/cdn-cgi/access",
  "/api/auth/login",
  "PBKDF2",
  "password_hash",
  "Mật khẩu",
] as const;

const requiredMarkers = [
  "/api/auth/sso/callback",
  "ES256",
  "X-CSRF-Token",
  "UPDATE sessions SET revoked_at",
] as const;

export function scanSsoBundleText(value: string) {
  return {
    forbidden: forbiddenMarkers.filter((marker) => value.includes(marker)),
    missing: requiredMarkers.filter((marker) => !value.includes(marker)),
  };
}

function filesAt(target: string): string[] {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(target, entry.name);
    return entry.isDirectory() ? filesAt(fullPath) : entry.isFile() && /\.(?:js|mjs|html)$/u.test(entry.name) ? [fullPath] : [];
  });
}

export function scanSsoBundlePaths(targets: string[]) {
  const files = targets.flatMap(filesAt);
  const combined = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  return { files, ...scanSsoBundleText(combined) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) throw new Error("Provide at least one Worker or SPA bundle path");
  const report = scanSsoBundlePaths(targets);
  const ok = report.forbidden.length === 0 && report.missing.length === 0;
  console.log(JSON.stringify({ ok, ...report }, null, 2));
  if (!ok) process.exitCode = 1;
}
