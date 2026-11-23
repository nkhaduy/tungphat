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
});
