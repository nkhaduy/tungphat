import { describe, expect, it } from "vitest";
import { mergeProductEditorial } from "@/lib/product-editorial";
import { extraMaterialGuidance } from "@/lib/material-wave2";

describe("material-specific buyer guidance", () => {
  it("covers the remaining material families without duplicating sections", () => {
    expect(Object.keys(extraMaterialGuidance)).toHaveLength(10);
    expect(new Set(Object.values(extraMaterialGuidance)).size).toBe(10);
    const bySlug = new Map(mergeProductEditorial([]).map((entry) => [entry.slug, entry]));
    for (const [slug, guidance] of Object.entries(extraMaterialGuidance)) {
      if (bySlug.has(slug)) expect(bySlug.get(slug)?.body).toContain(guidance);
    }
    expect(extraMaterialGuidance['van-mfc']).toContain('ván dăm');
    expect(extraMaterialGuidance['pvc-film-pet']).toContain('PVC');
    expect(extraMaterialGuidance['go-ghep-tram']).toContain('mẫu');
  });
});
