import { readFileSync } from "node:fs";
import vercelConfig from "@/vercel.json";
import { describe, expect, it } from "vitest";
import { comparePageSignals } from "@/lib/hosting-parity";

describe("hosting parity comparison", () => {
  it("reports a canonical mismatch for the same sitemap route", () => {
    const comparison = comparePageSignals(
      {
        status: 200,
        finalUrl: "https://mdftungphat.com/van-mdf/",
        redirects: [],
        title: "Ván MDF | Tùng Phát",
        canonical: "https://mdftungphat.com/van-mdf/",
        description: "Mô tả",
        robots: "index, follow",
        schemaCount: 1,
      },
      {
        status: 200,
        finalUrl: "https://preview.example/van-mdf/",
        redirects: [],
        title: "Ván MDF | Tùng Phát",
        canonical: "https://preview.example/van-mdf/",
        description: "Mô tả",
        robots: "index, follow",
        schemaCount: 1,
      },
    );

    expect(comparison.mismatches).toEqual(["canonical"]);
  });

  it("keeps every non-host Vercel redirect and Pages SEO header scope", () => {
    const redirects = readFileSync("public/_redirects", "utf8");
    const headers = readFileSync("public/_headers", "utf8");
    const rules = vercelConfig.redirects.filter((rule) => !rule.has?.some((condition) => condition.type === "host"));

    for (const rule of rules) {
      const source = rule.source.replace(":path*", "*");
      const status = rule.permanent ? 308 : 307;
      expect(redirects).toContain(`${source} ${rule.destination} ${status}`);
    }

    expect(redirects).toContain("/catalog/* https://cms.mdftungphat.com/media/catalog/:splat 200");
    expect(headers).toContain("/cms-preview/*");
    expect(headers).toContain("X-Robots-Tag: noindex, nofollow, noarchive");
  });
});
