import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { measurePagesCapacity } from "@/scripts/lib/cloudflare-pages-capacity.mjs";

describe("Cloudflare Pages deployment capacity", () => {
  it("measures the complete selected directory and applies both Pages gates", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pages-capacity-"));
    fs.mkdirSync(path.join(directory, "nested"));
    fs.writeFileSync(path.join(directory, "a.txt"), "abc");
    fs.writeFileSync(path.join(directory, "nested", "b.txt"), "12345");

    expect(measurePagesCapacity(directory, "STATIC_OUTPUT", { fileLimit: 1, maxFileBytes: 4 })).toEqual({
      scope: "STATIC_OUTPUT",
      directory,
      fileCount: 2,
      bytes: 8,
      maxFileBytes: 5,
      cloudflarePagesFileLimit: 1,
      cloudflarePagesMaxFileBytes: 4,
      fileCountGate: "FAIL",
      maxFileGate: "FAIL",
    });
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
