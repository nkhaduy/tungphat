import { describe, expect, it } from "vitest";
import { absolutePageUrl, webPageSchema } from "@/lib/seo";

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
});
