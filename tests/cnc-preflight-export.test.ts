import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CNC preflight export", () => {
  it("generates a reusable checklist without claiming unverified machine limits", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "tungphat-cnc-preflight-"));
    const output = path.join(directory, "cnc-preflight-checklist.csv");

    execFileSync(process.execPath, ["scripts/generate-cnc-preflight.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, CNC_PREFLIGHT_OUTPUT: output },
    });

    const csv = readFileSync(output, "utf8");
    expect(csv).toContain('"units","Đơn vị đo"');
    expect(csv).toContain('"geometry","Đường cắt và biên dạng"');
    expect(csv).toContain("status,lastVerified,sourceUrls");
    expect(csv).toContain('"Cần Tùng Phát kiểm tra"');
    expect(csv).not.toMatch(/±\s*0[.,]1|dung sai cố định|nhận mọi định dạng/iu);
  });
});
