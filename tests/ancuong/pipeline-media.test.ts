import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  downloadMedia,
  inspectImageBytes,
  type MediaDownloadInput,
} from "../../scripts/ancuong/download-media";
import { stableStringify } from "../../scripts/ancuong/stable-json";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("An Cuong media pipeline", () => {
  it("detects MIME from bytes and rejects an HTML challenge", () => {
    expect(inspectImageBytes(PNG_1X1, "image/jpeg")).toEqual({
      mimeType: "image/png",
      width: 1,
      height: 1,
    });
    expect(() =>
      inspectImageBytes(
        Buffer.from("<!doctype html><title>Attention Required</title>"),
        "image/webp",
      ),
    ).toThrow(/HTML|challenge/i);
  });

  it("downloads once, deduplicates by checksum and writes a stable manifest", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "ancuong-media-"));
    const input: MediaDownloadInput[] = [
      {
        sourceUrl: "https://ancuong.com/a.png",
        productSourceId: "10",
        productCode: "MFC - MS 103 SMM",
        role: "primary",
      },
      {
        sourceUrl: "https://ancuong.com/a.png",
        productSourceId: "11",
        productCode: "LK 4614 A",
        role: "gallery",
      },
    ];
    const fetchImpl = async () =>
      new Response(PNG_1X1, {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      });

    const first = await downloadMedia(input, {
      outputDir,
      fetchImpl,
      concurrency: 2,
    });
    const second = await downloadMedia(input, {
      outputDir,
      fetchImpl,
      concurrency: 2,
    });

    expect(first.records.map((record) => record.status)).toEqual([
      "downloaded",
      "duplicate",
    ]);
    expect(first.records[1]?.duplicateOf).toBe(first.records[0]?.localPath);
    expect(first.records[0]?.mimeType).toBe("image/png");
    expect(first.records[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await stat(path.join(outputDir, first.records[0]!.localPath!)),
    ).toBeTruthy();
    expect(second.records.map((record) => record.sha256)).toEqual(
      first.records.map((record) => record.sha256),
    );
    expect(second.records.map((record) => record.localPath)).toEqual(
      first.records.map((record) => record.localPath),
    );
    expect(stableStringify(second)).toBe(stableStringify(first));
    expect(
      await readFile(path.join(outputDir, "media-manifest.json"), "utf8"),
    ).toBe(stableStringify(second));
  });

  it("rehydrates a manifest record when its local binary is missing", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "ancuong-media-stale-"),
    );
    const sourceUrl = "https://ancuong.com/stale.png";
    const sha256 =
      "431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460";
    await writeFile(
      path.join(outputDir, "media-manifest.json"),
      stableStringify({
        records: [
          {
            sourceUrl,
            productCode: "MFC - MS 103 SMM",
            role: "primary",
            status: "downloaded",
            sha256,
            localPath: `files/${sha256}.png`,
          },
        ],
        summary: {
          total: 1,
          totalBytes: PNG_1X1.length,
          downloaded: 1,
          duplicate: 0,
          missing: 0,
          invalid: 0,
          failed: 0,
          "dry-run": 0,
        },
      }),
    );

    const result = await downloadMedia(
      [{ sourceUrl, productCode: "MFC - MS 103 SMM", role: "primary" }],
      {
        outputDir,
        fetchImpl: async () =>
          new Response(PNG_1X1, {
            status: 200,
            headers: { "content-type": "image/png" },
          }),
      },
    );

    expect(result.records[0]).toMatchObject({ status: "downloaded", sha256 });
    expect(
      await stat(path.join(outputDir, `files/${sha256}.png`)),
    ).toBeTruthy();
  });

  it("reuses a local binary for another role with the same source URL", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "ancuong-media-role-"));
    const sourceUrl = "https://ancuong.com/shared.png";
    const sha256 =
      "431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460";
    const localPath = `files/${sha256}.png`;
    await mkdir(path.join(outputDir, "files"));
    await writeFile(path.join(outputDir, localPath), PNG_1X1);
    await writeFile(
      path.join(outputDir, "media-manifest.json"),
      stableStringify({
        records: [
          {
            sourceUrl,
            productCode: "MFC - MS 103 SMM",
            role: "gallery",
            status: "downloaded",
            sha256,
            localPath,
            filename: `${sha256}.png`,
            mimeType: "image/png",
            width: 1,
            height: 1,
            bytes: PNG_1X1.length,
          },
        ],
        summary: {
          total: 1,
          totalBytes: PNG_1X1.length,
          downloaded: 1,
          duplicate: 0,
          missing: 0,
          invalid: 0,
          failed: 0,
          "dry-run": 0,
        },
      }),
    );
    let fetches = 0;

    const result = await downloadMedia(
      [{ sourceUrl, productCode: "MFC - MS 103 SMM", role: "primary" }],
      {
        outputDir,
        fetchImpl: async () => {
          fetches += 1;
          throw new Error("network should not be used");
        },
      },
    );

    expect(fetches).toBe(0);
    expect(result.records[0]).toMatchObject({
      status: "duplicate",
      localPath,
      sha256,
      duplicateOf: localPath,
    });
  });

  it("marks non-images and missing responses without writing payload files", async () => {
    const outputDir = await mkdtemp(
      path.join(tmpdir(), "ancuong-media-invalid-"),
    );
    const fetchImpl = async (input: string | URL | Request) => {
      const url = String(input);
      return url.endsWith("missing.png")
        ? new Response("missing", { status: 404 })
        : new Response("<html>challenge</html>", {
            status: 200,
            headers: { "content-type": "image/png" },
          });
    };
    const result = await downloadMedia(
      [
        {
          sourceUrl: "https://ancuong.com/missing.png",
          productCode: "M1",
          role: "primary",
        },
        {
          sourceUrl: "https://ancuong.com/challenge.png",
          productCode: "M2",
          role: "gallery",
        },
      ],
      { outputDir, fetchImpl },
    );

    expect(result.records.map((record) => record.status)).toEqual([
      "missing",
      "invalid",
    ]);
    expect(result.summary).toEqual(
      expect.objectContaining({ missing: 1, invalid: 1, downloaded: 0 }),
    );
  });
});
