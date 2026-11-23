import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  canonicalMetadataRoutes,
  indexableMetadataRoutes,
  noindexMetadataRoutes,
} from "../scripts/lib/metadata-route-policy.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validators = ["check-sitemap-output.mjs", "check-metadata-output.mjs", "check-llms-output.mjs"];
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("preview indexing output validation", () => {
  it("accepts globally noindex preview HTML while production still rejects it", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "tungphat-preview-indexing-"));
    temporaryDirectories.push(directory);
    await writePreviewArtifacts(directory);

    const previewResults = validators.map((validator) => runValidator(directory, validator, true));
    expect(previewResults.map((result) => result.status), previewResults.map((result) => `${result.stdout}\n${result.stderr}`).join("\n")).toEqual([0, 0, 0]);

    const productionSitemap = runValidator(directory, validators[0]!, false);
    const productionMetadata = runValidator(directory, validators[1]!, false);
    expect(productionSitemap.status).not.toBe(0);
    expect(productionMetadata.status).not.toBe(0);
  });
});

async function writePreviewArtifacts(directory: string) {
  const sitemapRoutes = [...indexableMetadataRoutes, "/", "/san-pham/"];
  const sitemapUrls = sitemapRoutes.map((route) => `${siteOrigin}${route}`);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
  await mkdir(path.join(directory, "out"), { recursive: true });
  await writeFile(path.join(directory, "out", "sitemap.xml"), sitemap);

  const allRoutes = [...new Set([...sitemapRoutes, ...noindexMetadataRoutes])];
  for (const route of allRoutes) {
    const canonicalPath = canonicalMetadataRoutes[route] ?? route;
    const canonicalUrl = `${siteOrigin}${canonicalPath}`;
    const html = `<html><head><title>QA preview ${route}</title><link rel="canonical" href="${canonicalUrl}"/><meta name="robots" content="noindex, nofollow"/><meta property="og:url" content="${canonicalUrl}"/></head><body><h1>Tiêu đề ${route}</h1><main><p>Nội dung kiểm tra môi trường preview.</p></main></body></html>`;
    const outputPath = path.join(directory, "out", route, "index.html");
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }

  const headings = ["Trang chính", "Sản phẩm", "Catalogue", "Dịch vụ", "Bài viết", "Liên hệ"];
  const links = sitemapUrls.map((url, index) => `- [Trang ${index + 1}](${url}): Mô tả nội dung kiểm tra noindex của trang preview.`);
  const sections = headings.map((heading, sectionIndex) => {
    const sectionLinks = links.filter((_, index) => index % headings.length === sectionIndex);
    return `## ${heading}\n\n${sectionLinks.join("\n")}`;
  });
  const markdown = [`# MDF Tùng Phát — Chỉ mục nội dung preview`, "", ...sections, "", "- [Nhắn Zalo](https://zalo.me/0909259160): Kênh liên hệ kiểm thử."].join("\n\n");
  await writeFile(path.join(directory, "out", "llms.txt"), markdown);
}

function runValidator(directory: string, validator: string, preview: boolean) {
  const script = path.join(projectRoot, "scripts", validator);
  return spawnSync(process.execPath, [script], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_ORIGIN: siteOrigin,
      SEO_SITE_URL: siteOrigin,
      STATIC_BUILD_TARGET: preview ? "preview" : "production",
    },
  });
}

const siteOrigin = "https://gotungphat.com";
