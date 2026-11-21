import { describe, expect, it } from "vitest";
import {
  buildProductLandingSchema,
  buildServiceLandingSchema,
} from "@/lib/content-jsonld";

const product = {
  slug: "go-ghep",
  status: "guide" as const,
  title: "Gỗ ghép: cách chọn theo nhu cầu",
  excerpt: "Hướng dẫn chọn nhóm gỗ ghép theo nhu cầu thực tế.",
  featuredImage: "/images/wood-panels.webp",
  category: "Hướng dẫn gỗ ghép",
  materialType: "Nhóm ván gỗ ghép",
  supplier: "",
  dimensions: ["Theo yêu cầu"],
  thicknesses: ["Theo thiết kế"],
  surfaces: ["Theo mẫu"],
};

describe("buildProductLandingSchema", () => {
  it("uses CollectionPage for guide hubs with canonical page URLs", () => {
    expect(buildProductLandingSchema(product)).toMatchObject({
      "@type": "CollectionPage",
      "@id": "https://mdftungphat.com/go-ghep/#webpage",
      url: "https://mdftungphat.com/go-ghep/",
    });
  });

  it.each(["van-mdf", "mdf-chong-am", "go-ghep-cao-su", "go-ghep-tram"])("describes the material family %s as a collection, not a single purchasable SKU", (slug) => {
    const schema = buildProductLandingSchema({ ...product, slug, status: "available" });
    expect(schema).toMatchObject({
      "@type": "CollectionPage",
      "@id": `https://mdftungphat.com/${slug}/#webpage`,
      url: `https://mdftungphat.com/${slug}/`,
    });
    expect(schema).not.toHaveProperty("offers");
    expect(schema).not.toHaveProperty("aggregateRating");
  });

  it("keeps individual product pages as Product schema", () => {
    expect(
      buildProductLandingSchema({
        ...product,
        slug: "mdf-specific-sku",
        status: "available",
        supplier: "Nhà cung cấp xác minh",
      }),
    ).toMatchObject({
      "@type": "Product",
      "@id": "https://mdftungphat.com/mdf-specific-sku/#product",
      url: "https://mdftungphat.com/mdf-specific-sku/",
      brand: { "@type": "Brand", name: "Nhà cung cấp xác minh" },
    });
  });
});

describe("buildServiceLandingSchema", () => {
  it("uses canonical page URLs and fragment placement", () => {
    expect(
      buildServiceLandingSchema({
        slug: "cat-cnc-go",
        title: "Cắt CNC gỗ theo file kỹ thuật",
        excerpt: "Dịch vụ gia công theo dữ liệu đã xác nhận.",
      }),
    ).toMatchObject({
      "@type": "Service",
      "@id": "https://mdftungphat.com/cat-cnc-go/#service",
      url: "https://mdftungphat.com/cat-cnc-go/",
    });
  });
});
