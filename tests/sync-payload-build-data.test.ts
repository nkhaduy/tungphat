import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fetchPayloadGlobal, normalizePayloadGlobal, productPublicationState, syncPayloadBuildData } from "../scripts/sync-payload-build-data";

describe("Payload build data normalization", () => {
  it("converts Payload relationship and array shapes to frontend settings", () => {
    expect(normalizePayloadGlobal("business-settings", {
      id: 1,
      globalType: "business-settings",
      updatedAt: "2026-08-17T00:00:00.000Z",
      serviceAreas: [{ id: "row-1", value: "TP. Hồ Chí Minh" }],
      socialLinks: [{ id: "row-2", value: "https://example.com" }],
      locations: [{
        id: "payload-row",
        locationId: "chi-nhanh-1",
        name: "Chi nhánh 1",
        image: { url: "/media/uploads/location.webp" },
      }],
    })).toEqual({
      serviceAreas: ["TP. Hồ Chí Minh"],
      socialLinks: ["https://example.com"],
      locations: [{
        id: "chi-nhanh-1",
        name: "Chi nhánh 1",
        image: "https://cdn.mdftungphat.com/uploads/location.webp",
      }],
    });
  });

  it("normalizes media and strips Payload row metadata recursively", () => {
    expect(normalizePayloadGlobal("brands", {
      id: 1,
      globalType: "brands",
      items: [{
        id: "row-1",
        slug: "an-cuong",
        logo: { id: 7, url: "/media/uploads/logo.webp", filename: "logo.webp" },
        catalogues: [{ id: "row-2", value: "/catalogue.pdf" }],
      }],
    })).toEqual({
      items: [{
        slug: "an-cuong",
        logo: "https://cdn.mdftungphat.com/uploads/logo.webp",
        catalogues: ["/catalogue.pdf"],
        products: [],
      }],
    });
  });

  it("preserves static page content dates and normalizes missing brand media", () => {
    expect(normalizePayloadGlobal("static-pages", {
      id: 1,
      updatedAt: "2026-08-17T00:00:00.000Z",
      globalType: "static-pages",
      contactIntro: "Liên hệ",
    })).toEqual({ updatedAt: "2026-08-17", contactIntro: "Liên hệ" });

    expect(normalizePayloadGlobal("brands", {
      items: [{ id: "row-1", slug: "kes", logo: null, catalogues: [] }],
    })).toEqual({ items: [{ slug: "kes", logo: "", catalogues: [], products: [] }] });
  });

  it("retains default social image dimensions and MIME metadata", () => {
    expect(normalizePayloadGlobal("seo-defaults", {
      defaultOgImage: {
        url: "/media/uploads/og.jpg",
        width: 1200,
        height: 630,
        mimeType: "image/jpeg",
      },
    })).toEqual({
      defaultOgImage: "https://cdn.mdftungphat.com/uploads/og.jpg",
      defaultOgImageWidth: 1200,
      defaultOgImageHeight: 630,
      defaultOgImageType: "image/jpeg",
    });
  });

  it("retries transient Payload failures before failing a build", async () => {
    let attempts = 0;
    const fetchImpl = async () => {
      attempts += 1;
      return attempts === 1
        ? new Response("temporary", { status: 500 })
        : Response.json({ globalType: "brands", items: [] });
    };

    await expect(fetchPayloadGlobal("brands", "https://cms.example", fetchImpl, 2, 0))
      .resolves.toEqual({ globalType: "brands", items: [] });
    expect(attempts).toBe(2);
  });
});


it("suppresses absent CMS-owned materials and published noindex materials in discovery", () => {
  expect(productPublicationState([
    { slug: "van-mdf", _status: "published" },
    { slug: "mdf-chong-am", _status: "published", seo: { noindex: true } },
    { slug: "local-guide-now-hidden", _status: "published", seo: { noindex: true } },
  ])).toEqual({ hiddenSlugs: ["go-ghep-cao-su", "go-ghep-tram", "local-guide-now-hidden", "mdf-chong-am"] });
});

describe("Payload build snapshot consistency", () => {
  const currentSnapshot = "{\"site\":\"last-known-good\"}\n";
  const globalPath = "content/settings/business.json";

  async function inTemporaryRoot(run: (root: string) => Promise<void>) {
    const root = await mkdtemp(path.join(tmpdir(), "tungphat-payload-test-"));
    try {
      await mkdir(path.join(root, "content/settings"), { recursive: true });
      await writeFile(path.join(root, globalPath), currentSnapshot);
      await run(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }

  function fetchFixture(failAt: string | null = null): typeof fetch {
    return (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (failAt && url.pathname.includes(failAt)) return new Response("unavailable", { status: 503 });
      if (url.pathname.endsWith("/api/products")) {
        return Response.json({ docs: [{ slug: "van-mdf", _status: "published" }], hasNextPage: false });
      }
      return Response.json({ globalType: url.pathname.split("/").pop(), businessName: "Tùng Phát" });
    }) as typeof fetch;
  }

  it("preserves all previous snapshots when a later CMS global fails", async () => {
    await inTemporaryRoot(async (root) => {
      await expect(syncPayloadBuildData({ root, fetchImpl: fetchFixture("material-categories") })).rejects.toThrow("503");
      expect(await readFile(path.join(root, globalPath), "utf8")).toBe(currentSnapshot);
      await expect(readFile(path.join(root, "content/settings/seo.json"))).rejects.toMatchObject({ code: "ENOENT" });
    });
  });

  it("preserves all previous snapshots when the publication response fails", async () => {
    await inTemporaryRoot(async (root) => {
      await expect(syncPayloadBuildData({ root, fetchImpl: fetchFixture("/api/products") })).rejects.toThrow("503");
      expect(await readFile(path.join(root, globalPath), "utf8")).toBe(currentSnapshot);
      await expect(readFile(path.join(root, "content/categories/product-publication.json")))
        .rejects.toMatchObject({ code: "ENOENT" });
    });
  });

  it("promotes a fully fetched set and rolls back if a later destination cannot be replaced", async () => {
    await inTemporaryRoot(async (root) => {
      await syncPayloadBuildData({ root, fetchImpl: fetchFixture() });
      expect(JSON.parse(await readFile(path.join(root, globalPath), "utf8"))).toEqual({ businessName: "Tùng Phát" });
      expect(JSON.parse(await readFile(path.join(root, "content/categories/product-publication.json"), "utf8")))
        .toEqual({ hiddenSlugs: ["go-ghep-cao-su", "go-ghep-tram", "mdf-chong-am"] });

      await writeFile(path.join(root, globalPath), currentSnapshot);
      const publicationPath = path.join(root, "content/categories/product-publication.json");
      const previousPublication = await readFile(publicationPath, "utf8");
      let promotionCount = 0;
      const renameImpl: typeof rename = async (from, to) => {
        if (String(to) === publicationPath) throw new Error("Injected last-step promotion failure");
        promotionCount += 1;
        return rename(from, to);
      };
      await expect(syncPayloadBuildData({ root, fetchImpl: fetchFixture(), renameImpl }))
        .rejects.toThrow("Injected last-step promotion failure");
      expect(promotionCount).toBeGreaterThan(0);
      expect(await readFile(path.join(root, globalPath), "utf8")).toBe(currentSnapshot);
      expect(await readFile(publicationPath, "utf8")).toBe(previousPublication);
    });
  });

  it("reports promotion and rollback failures, restores remaining snapshots and cleans staging", async () => {
    await inTemporaryRoot(async (root) => {
      await syncPayloadBuildData({ root, fetchImpl: fetchFixture() });
      const businessPath = path.join(root, globalPath);
      const seoPath = path.join(root, "content/settings/seo.json");
      const brandsPath = path.join(root, "content/categories/brands.json");
      const publicationPath = path.join(root, "content/categories/product-publication.json");
      const priorSeo = await readFile(seoPath, "utf8");
      const priorPublication = await readFile(publicationPath, "utf8");
      await writeFile(businessPath, currentSnapshot);
      await writeFile(brandsPath, '{"brand":"last-known-good"}\n');

      const promotionError = new Error("Injected publication promotion failure");
      const rollbackError = new Error("Injected brand snapshot restore failure");
      const renameImpl: typeof rename = async (from, to) => {
        if (String(to) === publicationPath && !String(from).includes("/restore/")) {
          throw promotionError;
        }
        if (String(to) === brandsPath && String(from).includes("/restore/")) {
          throw rollbackError;
        }
        return rename(from, to);
      };

      const failure = await syncPayloadBuildData({ root, fetchImpl: fetchFixture(), renameImpl })
        .then(() => null, (error: unknown) => error);
      expect(failure).toBeInstanceOf(AggregateError);
      expect((failure as AggregateError).errors).toContain(promotionError);
      expect((failure as AggregateError).errors).toContain(rollbackError);
      expect(await readFile(businessPath, "utf8")).toBe(currentSnapshot);
      expect(await readFile(seoPath, "utf8")).toBe(priorSeo);
      expect(await readFile(publicationPath, "utf8")).toBe(priorPublication);
      expect((await readdir(root)).filter((entry) => entry.startsWith(".payload-sync-"))).toEqual([]);
    });
  });
});
