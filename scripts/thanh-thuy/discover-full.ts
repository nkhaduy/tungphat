import { pathToFileURL } from "node:url";
import { auditThanhThuyProductUrls } from "./audit-product-urls";
import { discoverSource } from "./discover";
import { parseCliArgs } from "./lib";

async function main() {
  const args = parseCliArgs();
  const refresh = args.has("refresh");
  await discoverSource({ resume: !refresh });
  await auditThanhThuyProductUrls({
    refresh,
    concurrency: typeof args.get("concurrency") === "string" ? Number(args.get("concurrency")) : undefined,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
