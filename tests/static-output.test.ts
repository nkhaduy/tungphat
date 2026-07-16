import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function files(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? files(absolute) : [absolute];
  });
}

describe("Cloudflare Pages static output", () => {
  it("does not source the legacy video from public", () => {
    expect(existsSync("public/0619.mp4")).toBe(false);
  });

  it("contains no 0619.mp4 or file above 24 MiB when out exists", () => {
    const outputFiles = files("out");
    expect(outputFiles.some((file) => path.basename(file) === "0619.mp4")).toBe(false);
    expect(outputFiles.filter((file) => statSync(file).size > 24 * 1024 * 1024)).toEqual([]);
  });
});
