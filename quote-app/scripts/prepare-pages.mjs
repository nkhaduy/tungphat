import { readFile, rm, unlink, writeFile } from "node:fs/promises";

const source = new URL("../dist/pages-worker/index.js", import.meta.url);
const sourceMap = new URL("../dist/pages-worker/index.js.map", import.meta.url);
const target = new URL("../dist/client/_worker.js", import.meta.url);
const targetMap = new URL("../dist/client/_worker.js.map", import.meta.url);
const viteDeployConfig = new URL("../.wrangler/deploy/config.json", import.meta.url);
const worker = (await readFile(source, "utf8")).replace(/\n?\/\/# sourceMappingURL=index\.js\.map\s*$/, "");
await writeFile(target, worker);
// Do not publish the Worker source map as a public Pages asset.
await unlink(targetMap).catch((error) => {
  if (error?.code !== "ENOENT") throw error;
});
await unlink(sourceMap).catch(() => undefined);
await unlink(viteDeployConfig).catch((error) => {
  if (error?.code !== "ENOENT") throw error;
});
await rm(new URL("../dist/pages-worker/", import.meta.url), { recursive: true, force: true });
await rm(new URL("../dist/.DS_Store", import.meta.url), { force: true });
console.log("Prepared Cloudflare Pages advanced-mode worker in dist/client/_worker.js");
