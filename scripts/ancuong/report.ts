import { atomicWriteJson } from "./stable-json";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { paths } from "./config";
import type { CliOptions } from "./types";
import { readJsonIfExists } from "./stable-json";

export interface ReportSection { heading: string; values: Record<string, string | number | boolean | null | undefined> }
export interface PipelineReport { title: string; generatedAt: string; sections: ReportSection[]; notes?: string[] }

export function renderPipelineReport(report: PipelineReport): string {
  const lines = [`# ${report.title}`, "", `Generated: ${report.generatedAt}`, ""];
  for (const section of report.sections) {
    lines.push(`## ${section.heading}`, "");
    for (const [key, value] of Object.entries(section.values).sort(([left], [right]) => left.localeCompare(right))) lines.push(`- ${key}: ${value ?? ""}`);
    lines.push("");
  }
  if (report.notes?.length) {
    lines.push("## Notes", "", ...report.notes.map((note) => `- ${note}`), "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export async function writePipelineReport(directory: string, basename: string, report: PipelineReport): Promise<void> {
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, `${basename}.md`);
  const temporary = path.join(directory, `.${basename}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, renderPipelineReport(report), "utf8");
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  await atomicWriteJson(path.join(directory, `${basename}.json`), report);
}

export async function run(options: CliOptions): Promise<PipelineReport> {
  const validation = await readJsonIfExists<{ summary?: Record<string, number> }>(path.join(paths.reports, "validation-report.json"));
  const diff = await readJsonIfExists<{ summary?: Record<string, number> }>(path.join(paths.reports, "latest-diff.json"));
  const previous = await readJsonIfExists<PipelineReport>(path.join(paths.reports, "ancuong-pipeline-report.json"));
  const report: PipelineReport = {
    title: "An Cuong catalogue pipeline report",
    generatedAt: previous?.generatedAt ?? new Date().toISOString(),
    sections: [
      { heading: "Validation", values: validation?.summary ?? {} },
      { heading: "Diff", values: diff?.summary ?? {} },
    ],
  };
  if (!options.dryRun) await writePipelineReport(paths.reports, "ancuong-pipeline-report", report);
  return report;
}
