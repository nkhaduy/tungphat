#!/usr/bin/env node
import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const BUCKETS = {
  preview: "tung-phat-media-preview",
  production: "tung-phat-media"
};

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) fail(`Unexpected argument: ${argument}`);
    const name = argument.slice(2);
    if (name === "confirm" || name === "allow-overwrite") result[name] = true;
    else result[name] = argv[++index];
  }
  return result;
}

async function publicHead(baseUrl, key) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/${key}`, { method: "HEAD", redirect: "error" });
  return response;
}

const args = parseArgs(process.argv.slice(2));
const environment = args.environment;
const bucket = BUCKETS[environment];
if (!bucket) fail("--environment must be preview or production");
if (!args.file || !existsSync(args.file) || !statSync(args.file).isFile()) fail("--file must point to an existing regular file");
if (!args.key || args.key.startsWith("/") || args.key.includes("\\") || args.key.includes("..") || args.key.includes("*")) fail("--key is not a safe exact object key");
if (!args["content-type"] || !/^(image\/(jpeg|png|webp|avif)|video\/(mp4|webm)|application\/pdf)$/.test(args["content-type"])) fail("--content-type is missing or unsupported");
const cacheControl = args["cache-control"] || "public, max-age=31536000, immutable";
const publicBaseUrl = args["public-base-url"];
const size = statSync(args.file).size;

console.log(`Environment: ${environment}`);
console.log(`Bucket:      ${bucket}`);
console.log(`Object key:  ${args.key}`);
console.log(`Local file:  ${path.resolve(args.file)} (${size} bytes)`);
console.log(`Content-Type:${args["content-type"]}`);
console.log(`Cache-Control: ${cacheControl}`);

if (publicBaseUrl) {
  let existing;
  try {
    existing = await publicHead(publicBaseUrl, args.key);
  } catch (error) {
    fail(`could not check the public object URL before upload: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (existing.status === 200 && !args["allow-overwrite"]) fail("object already exists; refusing to overwrite (use a new key, or explicitly pass --allow-overwrite)");
  if (existing.status !== 200 && existing.status !== 404) fail(`preflight HEAD returned HTTP ${existing.status}; refusing an unverifiable upload`);
} else if (!args["allow-overwrite"]) {
  fail("--public-base-url is required for the no-overwrite preflight; --allow-overwrite is the explicit unsafe override");
}

if (!args.confirm) fail("dry confirmation only; review the destination above, then rerun with --confirm");

const wrangler = path.resolve("node_modules/.bin/wrangler");
const command = [
  "r2", "object", "put", `${bucket}/${args.key}`,
  "--remote",
  "--file", path.resolve(args.file),
  "--content-type", args["content-type"],
  "--cache-control", cacheControl
];
const upload = spawnSync(wrangler, command, { stdio: "inherit", env: process.env });
if (upload.status !== 0) fail(`Wrangler upload failed with exit code ${upload.status ?? "unknown"}`);

if (!publicBaseUrl) {
  console.log("Wrangler accepted the upload, but no public URL was supplied; verify the object independently before deleting the source file.");
  process.exit(0);
}

let verified = null;
for (let attempt = 0; attempt < 5; attempt += 1) {
  const response = await publicHead(publicBaseUrl, args.key);
  const remoteSize = Number(response.headers.get("Content-Length") || 0);
  const remoteType = (response.headers.get("Content-Type") || "").split(";", 1)[0];
  if (response.ok && remoteSize === size && remoteType === args["content-type"]) {
    verified = { remoteSize, remoteType };
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!verified) fail("upload command succeeded, but public HEAD verification did not match size and content type; keep the source file");
console.log(`VERIFIED: ${publicBaseUrl.replace(/\/+$/, "")}/${args.key} (${verified.remoteSize} bytes, ${verified.remoteType})`);
