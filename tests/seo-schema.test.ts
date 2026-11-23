import { afterEach, describe, expect, it, vi } from "vitest";
import { absolutePageUrl, createPageMetadata, webPageSchema } from "@/lib/seo";

afterEach(() => vi.unstubAllEnvs());

describe("canonical WebPage schema", () => {
  it("uses the trailing-slash canonical URL and links the primary entity", () => {
    const schema = webPageSchema({
      path: "/van-mdf",
      name: "Ván MDF",
      description: "Thông tin ván MDF",
      primaryEntityId: `${absolutePageUrl("/van-mdf")}#product`,
    });

    expect(schema).toMatchObject({
      "@type": "WebPage",
      "@id": "https://mdftungphat.com/van-mdf/#webpage",
      url: "https://mdftungphat.com/van-mdf/",
      isPartOf: { "@id": "https://mdftungphat.com/#website" },
      about: { "@id": "https://mdftungphat.com/#organization" },
      mainEntity: { "@id": "https://mdftungphat.com/van-mdf/#product" },
    });
  });

  it("marks every preview page noindex even when its content is publishable", () => {
    vi.stubEnv("STATIC_BUILD_TARGET", "preview");

    const metadata = createPageMetadata({
      title: "Bài QA staging",
      description: "Mô tả QA staging",
      path: "/bai-viet/qa-editorial-cms-staging",
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false, follow: false } });
  });

  it("keeps preview nofollow even when the production noindex route allows following", () => {
    vi.stubEnv("STATIC_BUILD_TARGET", "preview");

    const metadata = createPageMetadata({
      title: "Mã màu QA",
      description: "Trang kiểm thử",
      path: "/ma-mau-melamine/ba-thanh/",
      noIndex: true,
      followWhenNoIndex: true,
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false, follow: false } });
  });

  it("preserves the production follow policy for deliberate noindex pages", () => {
    vi.stubEnv("STATIC_BUILD_TARGET", "production");

    const metadata = createPageMetadata({
      title: "Mã màu",
      description: "Trang mã màu",
      path: "/ma-mau-melamine/ba-thanh/",
      noIndex: true,
      followWhenNoIndex: true,
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: true, googleBot: { index: false, follow: true } });
  });
});
