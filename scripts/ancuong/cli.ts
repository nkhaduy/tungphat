import { crawlerConfig } from "./config";
import type { CliOptions } from "./types";

export type AnCuongCommand =
  | "discover"
  | "crawl:non-numeric"
  | "crawl:product-lines"
  | "crawl:listings"
  | "crawl:details"
  | "crawl:relations"
  | "media"
  | "normalize"
  | "validate"
  | "diff"
  | "export"
  | "report"
  | "sample"
  | "all"
  | "test:live";

const commands = new Set<AnCuongCommand>([
  "discover", "crawl:non-numeric", "crawl:product-lines", "crawl:listings", "crawl:details", "crawl:relations", "media", "normalize", "validate", "diff", "export", "report", "sample", "all", "test:live"
]);

export function parseCliArgs(args: string[]): { command: AnCuongCommand; options: CliOptions } {
  const [rawCommand = "help", ...flags] = args;
  if (!commands.has(rawCommand as AnCuongCommand)) throw new Error(`Unknown An Cuong command: ${rawCommand}`);
  const options: CliOptions = {
    dryRun: false,
    resume: false,
    force: false,
    changedOnly: false,
    skipMedia: false,
    verbose: false,
    concurrency: crawlerConfig.defaultConcurrency
  };
  for (const flag of flags) {
    if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--resume") options.resume = true;
    else if (flag === "--force") options.force = true;
    else if (flag === "--changed-only") options.changedOnly = true;
    else if (flag === "--skip-media") options.skipMedia = true;
    else if (flag === "--verbose") options.verbose = true;
    else if (flag.startsWith("--category=")) options.category = flag.slice("--category=".length);
    else if (flag.startsWith("--product=")) options.product = flag.slice("--product=".length);
    else if (flag.startsWith("--limit=")) options.limit = parsePositiveInt(flag, "limit");
    else if (flag.startsWith("--concurrency=")) options.concurrency = parsePositiveInt(flag, "concurrency");
    else throw new Error(`Unknown An Cuong option: ${flag}`);
  }
  return { command: rawCommand as AnCuongCommand, options };
}

function parsePositiveInt(flag: string, label: string): number {
  const value = Number(flag.slice(flag.indexOf("=") + 1));
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
  return value;
}

type StepModule = { run?: (options: CliOptions) => Promise<unknown> | unknown };

const stepModules: Partial<Record<AnCuongCommand, string>> = {
  discover: "./discover",
  "crawl:non-numeric": "./crawl-non-numeric",
  "crawl:product-lines": "./crawl-product-lines",
  "crawl:listings": "./crawl-listings",
  "crawl:details": "./crawl-details",
  "crawl:relations": "./crawl-relations",
  media: "./download-media",
  normalize: "./normalize",
  validate: "./validate",
  diff: "./diff",
  export: "./export",
  report: "./report"
};

export const PIPELINE_STEPS = [
  "discover", "crawl:non-numeric", "crawl:product-lines", "crawl:listings", "crawl:details", "crawl:relations", "normalize", "media", "validate", "diff", "export", "report"
] as const;

export async function runCommand(command: AnCuongCommand, options: CliOptions): Promise<void> {
  if (command === "sample") {
    const runnerModule = (await import("./sample")) as StepModule;
    if (typeof runnerModule.run !== "function") throw new Error("Runner ./sample must export run(options)");
    await runnerModule.run(options);
    return;
  }
  if (command === "all") {
    for (const step of PIPELINE_STEPS) {
      await runCommand(step, options);
    }
    return;
  }
  if (command === "test:live") {
    await runCommand("discover", { ...options, limit: 1 });
    return;
  }
  const modulePath = stepModules[command];
  if (!modulePath) throw new Error(`No runner configured for ${command}`);
  const runnerModule = (await import(modulePath)) as StepModule;
  if (typeof runnerModule.run !== "function") throw new Error(`Runner ${modulePath} must export run(options)`);
  await runnerModule.run(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { command, options } = parseCliArgs(process.argv.slice(2));
  runCommand(command, options).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
