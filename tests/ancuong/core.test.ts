import { describe, expect, it } from "vitest";
import { normalizeProductCode } from "@/scripts/ancuong/normalize";
import { atomicWriteJson, readJsonIfExists } from "@/scripts/ancuong/stable-json";
import { createCheckpointStore } from "@/scripts/ancuong/state";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("An Cuong core helpers", () => {
  it("normalizes codes without collapsing meaningful prefixes or slashes", () => {
    expect(normalizeProductCode(" MFC - MS 462 SC01 ")).toBe("MFC - MS 462 SC01");
    expect(normalizeProductCode("PVC 401/LK4513")).toBe("PVC 401/LK4513");
    expect(normalizeProductCode("  LL  2273N  ")).toBe("LL 2273N");
    expect(normalizeProductCode("MFC  2.0  A")).toBe("MFC 2.0 A");
  });

  it("writes canonical JSON atomically and reads it back", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ancuong-core-"));
    const path = join(dir, "nested", "record.json");
    await atomicWriteJson(path, { z: 1, a: ["b", "a"] });
    expect(await readJsonIfExists(path)).toEqual({ a: ["b", "a"], z: 1 });
    expect((await readFile(path, "utf8")).endsWith("\n")).toBe(true);
  });

  it("resumes URL checkpoints without marking fetched before parsed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ancuong-state-"));
    const store = await createCheckpointStore(join(dir, "state.json"));
    await store.set("https://ancuong.com/melamine/1.html", "fetched");
    expect(await store.get("https://ancuong.com/melamine/1.html")).toBe("fetched");
    expect(await store.pending()).toEqual([]);
    await store.set("https://ancuong.com/melamine/2.html", "fetching");
    expect(await store.pending()).toEqual(["https://ancuong.com/melamine/2.html"]);
  });
});
