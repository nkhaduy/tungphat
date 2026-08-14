import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository tooling scope", () => {
  it("lints source directories instead of traversing the whole repository", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.lint).not.toContain("eslint .");
    expect(packageJson.scripts.lint).toContain("eslint app components lib scripts tests e2e functions workers");
  });

  it("keeps bulky runtime and catalogue assets out of normal file discovery", () => {
    const ignore = readFileSync(".ignore", "utf8");

    for (const path of [
      ".worktrees/",
      ".next/",
      "out/",
      "public/catalog/",
      "data/imports/",
      "reports/",
    ]) {
      expect(ignore).toContain(path);
    }
  });
});
