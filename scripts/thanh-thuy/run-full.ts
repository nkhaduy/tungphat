import path from "node:path";
import { pathToFileURL } from "node:url";
import { runThanhThuyFullArtifacts } from "./full";
import { runImport } from "./import";
import { parseCliArgs } from "./lib";

export async function runThanhThuyFullImport(options: {
  root?: string;
  sourceDirectory?: string;
  cacheDirectory?: string;
  dryRun?: boolean;
  resume?: boolean;
} = {}) {
  const root = options.root ?? process.cwd();
  const imported = await runImport({
    root,
    sourceDirectory: options.sourceDirectory,
    cacheDirectory: options.cacheDirectory,
    dryRun: options.dryRun,
    resume: options.resume,
  });
  const artifacts = await runThanhThuyFullArtifacts({
    root,
    dryRun: options.dryRun,
    importReport: imported.report,
    catalog: imported.catalog,
  });
  return { imported, artifacts };
}

async function main() {
  const args = parseCliArgs();
  await runThanhThuyFullImport({
    sourceDirectory: typeof args.get("source-dir") === "string" ? path.resolve(String(args.get("source-dir"))) : undefined,
    cacheDirectory: typeof args.get("cache-dir") === "string" ? path.resolve(String(args.get("cache-dir"))) : undefined,
    dryRun: args.has("dry-run"),
    resume: !args.has("refresh"),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
