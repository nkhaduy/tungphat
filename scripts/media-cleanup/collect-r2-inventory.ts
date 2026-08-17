import fs from "node:fs";
import path from "node:path";

async function main() {
  const endpoint = process.env.R2_INVENTORY_ENDPOINT || "http://127.0.0.1:8791/inventory";
  const output = process.env.R2_INVENTORY_OUTPUT || path.join(process.cwd(), "reports", "r2-media-inventory.json");
  const objects: Array<Record<string, unknown>> = [];
  let cursor = "";

  do {
    const url = new URL(endpoint);
    url.searchParams.set("limit", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`R2 inventory page failed: ${response.status}`);
    const page = await response.json() as { objects: Array<Record<string, unknown>>; truncated: boolean; cursor?: string };
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor || "" : "";
    process.stderr.write(`\rCollected ${objects.length} R2 objects`);
  } while (cursor);

  const totalBytes = objects.reduce((sum, object) => sum + Number(object.size || 0), 0);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), totalObjects: objects.length, totalBytes, objects }, null, 2)}\n`);
  process.stderr.write("\n");
  console.log(JSON.stringify({ output, totalObjects: objects.length, totalBytes }, null, 2));
}

void main();
