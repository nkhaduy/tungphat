import { describe, expect, it } from "vitest";
import {
  createThanhThuyMetadata,
  type ThanhThuySeoRecord,
} from "@/lib/thanh-thuy-seo";
import {
  createThanhThuyBreadcrumbSchema,
  createThanhThuyItemListSchema,
  createThanhThuyProductSchema,
} from "@/lib/thanh-thuy-schema";

const record: ThanhThuySeoRecord = {
  slug: "lp-101-104g",
  code: "LP 101/104G",
  name: "Melamine trắng LP 101/104G",
  categorySlug: "melamine",
  categoryName: "Melamine",
  description: "Bề mặt Melamine màu trắng cho nội thất.",
  image: "/catalog/thanh-thuy/lp-101-104g.webp",
  seoStatus: "READY_TO_INDEX",
  published: true,
  price: null,
};

describe("Thanh Thuy metadata", () => {
  it("uses a unique self-referencing canonical and indexable robots for ready records", () => {
    const metadata = createThanhThuyMetadata(
      record,
      "/san-pham/melamine/lp-101-104g/",
    );
    expect(metadata.alternates?.canonical).toBe(
      "https://mdftungphat.com/san-pham/melamine/lp-101-104g/",
    );
    expect(metadata.title).toContain("LP 101/104G");
    expect(metadata.description).toContain("Melamine");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("marks thin or unpublished records noindex while preserving canonical", () => {
    const metadata = createThanhThuyMetadata(
      { ...record, seoStatus: "NEEDS_ENRICHMENT", published: false },
      "/san-pham/melamine/lp-101-104g/",
    );
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBe(
      "https://mdftungphat.com/san-pham/melamine/lp-101-104g/",
    );
  });
});

describe("Thanh Thuy JSON-LD", () => {
  it("emits factual Product data without an Offer when no real price exists", () => {
    const schema = createThanhThuyProductSchema(
      record,
      "/san-pham/melamine/lp-101-104g/",
    ) as Record<string, unknown>;
    expect(schema["@type"]).toBe("Product");
    expect(schema.sku).toBe("LP 101/104G");
    expect(schema.material).toBe("Melamine");
    expect(schema.url).toBe(
      "https://mdftungphat.com/san-pham/melamine/lp-101-104g/",
    );
    expect(schema).not.toHaveProperty("offers");
  });

  it("keeps breadcrumb and item-list URLs on the Tùng Phát origin", () => {
    const breadcrumbs = createThanhThuyBreadcrumbSchema([
      { name: "Trang chủ", path: "/" },
      { name: "Melamine", path: "/san-pham/melamine/" },
    ]) as Record<string, unknown>;
    const breadcrumbItems = breadcrumbs.itemListElement as Array<Record<string, unknown>>;
    expect(breadcrumbItems[1].item).toBe(
      "https://mdftungphat.com/san-pham/melamine/",
    );

    const itemList = createThanhThuyItemListSchema([record], "Melamine Thanh Thùy") as Record<string, unknown>;
    expect(itemList["@type"]).toBe("ItemList");
    const listItems = itemList.itemListElement as Array<Record<string, unknown>>;
    expect(listItems[0].url).toContain("mdftungphat.com/san-pham/melamine/");
  });
});
