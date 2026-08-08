import fs from "node:fs";
import path from "node:path";
import { analyzeInternalLinkGraph } from "../lib/internal-link-graph";

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

function routeFor(file: string) {
  const relative = path.relative("out", file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/\/index\.html$/u, "/")}`;
}

const pages = walk("out").filter((file) => file.endsWith(".html")).map((file) => ({ url: routeFor(file), html: fs.readFileSync(file, "utf8") }));
const graph = analyzeInternalLinkGraph(pages);
const priorityUrls = ["/", "/san-pham/", "/van-go-cong-nghiep/", "/gia-cong-cnc/", "/cat-cnc-go/", "/tham-chieu-vat-lieu/"];
const weakPriorityUrls = priorityUrls.filter((url) => {
  const node = graph.byUrl[url];
  return !node || node.clickDepth === null || node.clickDepth > 3 || node.internalInlinks < 2;
});
const report = { generatedAt: new Date().toISOString(), ...graph, priorityUrls, weakPriorityUrls };
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/internal-link-graph.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ pageCount: graph.pageCount, priority: Object.fromEntries(priorityUrls.map((url) => [url, graph.byUrl[url] ?? null])), weakPriorityUrls }, null, 2));
