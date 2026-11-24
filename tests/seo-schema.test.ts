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
      "@id": "https://gotungphat.com/van-mdf/#webpage",
      url: "https://gotungphat.com/van-mdf/",
      isPartOf: { "@id": "https://gotungphat.com/#website" },
      about: { "@id": "https://gotungphat.com/#organization" },
      mainEntity: { "@id": "https://gotungphat.com/van-mdf/#product" },
    });
  });
});
