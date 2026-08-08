import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { activeCmsProvider, readLightSnapshot } from "@/lib/cms-provider";

const oldProvider = process.env.CMS_PROVIDER;
const oldSnapshot = process.env.LIGHT_CMS_SNAPSHOT;

afterEach(() => {
  if (oldProvider === undefined) delete process.env.CMS_PROVIDER; else process.env.CMS_PROVIDER = oldProvider;
  if (oldSnapshot === undefined) delete process.env.LIGHT_CMS_SNAPSHOT; else process.env.LIGHT_CMS_SNAPSHOT = oldSnapshot;
});

function writeSnapshot(checksum = "") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tungphat-light-snapshot-"));
  const unsigned = { schemaVersion: 1 as const, generatedAt: "2026-08-04T00:00:00.000Z", records: [], settings: {}, media: [] };
  const value = checksum || createHash("sha256").update(JSON.stringify(unsigned)).digest("hex");
  const file = path.join(directory, "snapshot.json"); fs.writeFileSync(file, JSON.stringify({ ...unsigned, checksum: value }));
  process.env.LIGHT_CMS_SNAPSHOT = file;
  return directory;
}

describe("Light CMS website provider", () => {
  it("accepts light explicitly while preserving Decap default", () => { delete process.env.CMS_PROVIDER; expect(activeCmsProvider()).toBe("decap"); process.env.CMS_PROVIDER = "light"; expect(activeCmsProvider()).toBe("light"); process.env.CMS_PROVIDER = "invalid"; expect(activeCmsProvider()).toBe("decap"); });
  it("rejects malformed and checksum-tampered snapshots", () => { const directory = writeSnapshot("0".repeat(64)); expect(() => readLightSnapshot()).toThrow(/checksum/i); fs.rmSync(directory, { recursive: true, force: true }); });
});
