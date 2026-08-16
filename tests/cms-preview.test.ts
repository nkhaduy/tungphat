import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { CMS_PREVIEW_MAX_BYTES, previewEntry, sanitizeCmsPreviewDraft } from "@/lib/cms-preview";

describe("CMS preview security and shell", () => {
  it("keeps the login surface minimal and password-manager friendly", () => {
    const html = readFileSync("cloudflare-cms/public/index.html", "utf8");
    expect(html).toContain("logo-horizontal.png");
    expect(html).toContain("<label for=\"username\">Tài khoản</label>");
    expect(html).toContain("type=\"password\"");
    expect(html).toContain("autocomplete=\"current-password\"");
    expect(html).not.toContain("Tùng Phát CMS</h1>");
    expect(html).not.toContain("Quản lý nội dung và theo dõi hoạt động website");
    expect(html).not.toContain("password-toggle");
  });

  it("removes the Identity shim and uses the shared-session backend", () => {
    const bootstrap = readFileSync("cloudflare-cms/public/admin-bootstrap.js", "utf8");
    const shell = readFileSync("cloudflare-cms/public/admin-shell.js", "utf8");
    const config = readFileSync("cloudflare-cms/public/config.yml", "utf8");
    expect(`${bootstrap}\n${shell}`).not.toMatch(/netlifyIdentity|identity\.netlify\.com|gotrue/i);
    expect(config).toContain("name: tungphat-gateway");
  });

  it("requires the authenticated shell and exposes no draft endpoint", () => {
    const html = readFileSync("cloudflare-cms/public/index.html", "utf8");
    const headers = readFileSync("cloudflare-cms/public/_headers", "utf8");
    expect(html).toContain("id=\"preview-view\"");
    expect(html).toContain("id=\"admin-app\" class=\"admin-app\" hidden");
    expect(headers).toContain("Cache-Control: private, no-store");
    expect(headers).toContain("X-Robots-Tag: noindex, nofollow");
    expect(headers).toContain("frame-src 'self' blob: https://mdftungphat.com");
  });

  it("applies no-store and noindex to the exact trailing-slash preview route", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8"));
    const global = config.headers.find((rule: { source: string }) => rule.source === "/(.*)");
    const exact = config.headers.find((rule: { source: string }) => rule.source === "/cms-preview/");
    expect(global?.headers).not.toContainEqual({ key: "X-Frame-Options", value: "SAMEORIGIN" });
    expect(global?.headers.find((header: { key: string }) => header.key === "Content-Security-Policy")?.value).toContain("frame-ancestors 'self' https://cms.mdftungphat.com");
    expect(readFileSync("public/_headers", "utf8")).not.toContain("X-Frame-Options: SAMEORIGIN");
    expect(exact?.headers).toEqual(expect.arrayContaining([
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    ]));
  });

  it("allows Google Tag Manager telemetry through the production CSP", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8"));
    const global = config.headers.find((rule: { source: string }) => rule.source === "/(.*)");
    const csp = global?.headers.find(
      (header: { key: string }) => header.key === "Content-Security-Policy",
    )?.value;

    expect(csp).toMatch(
      /connect-src[^;]*https:\/\/www\.googletagmanager\.com(?:\s|;)/,
    );
  });

  it("validates, allowlists, limits and sanitizes in-memory drafts", () => {
    const draft = sanitizeCmsPreviewDraft({
      collection: "articles",
      data: {
        title: "Bài viết đang sửa",
        slug: "bai-viet-dang-sua",
        draft: true,
        body: "# Hợp lệ\n<script>steal()</script><iframe src=\"https://evil.example\"></iframe>\n| A | B |\n| - | - |\n| 1 | 2 |",
        secret: "must-not-pass",
      },
    });
    expect(draft).not.toBeNull();
    expect(draft?.data).not.toHaveProperty("secret");
    expect(draft?.data.body).not.toMatch(/<script|<iframe/i);
    expect(sanitizeCmsPreviewDraft({ collection: "unknown", data: {} })).toBeNull();
    expect(sanitizeCmsPreviewDraft({ collection: "articles", data: { body: "x".repeat(CMS_PREVIEW_MAX_BYTES + 1) } })).toBeNull();
  });

  it("uses the production Markdown renderer without executable HTML", () => {
    const draft = sanitizeCmsPreviewDraft({ collection: "articles", data: { body: "# Tiêu đề\n<script>alert(1)</script>\n> Trích dẫn" } });
    expect(draft).not.toBeNull();
    const normalized = previewEntry(draft!);
    expect(normalized.collection).toBe("articles");
    if (normalized.collection !== "articles") throw new Error("unexpected collection");
    const html = renderToStaticMarkup(createElement(MarkdownContent, null, normalized.entry.body));
    expect(html).toContain("<h1>Tiêu đề</h1>");
    expect(html).toContain("<blockquote>");
    expect(html).not.toContain("<script");
  });
});
