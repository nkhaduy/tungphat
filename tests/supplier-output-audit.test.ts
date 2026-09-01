import { describe, expect, it } from "vitest";
import { auditSupplierPages } from "../scripts/catalog-suppliers/output-audit";

function page(input: {
  route: string;
  supplierId: "thanh-thuy" | "ba-thanh" | "an-cuong";
  brand: string;
  title: string;
  description: string;
  indexable?: boolean;
  productSchema?: boolean;
  breadcrumbSchema?: boolean;
  completeDetail?: boolean;
}) {
  const canonical = `https://mdftungphat.com${input.route}`;
  const schemas = [
    input.productSchema === false ? null : {
      "@context": "https://schema.org",
      "@type": "Product",
      name: input.title,
      brand: { "@type": "Brand", name: input.brand },
      url: canonical,
    },
    input.breadcrumbSchema ? {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    } : null,
  ].filter(Boolean);
  return {
    route: input.route,
    supplierId: input.supplierId,
    indexable: input.indexable ?? true,
    html: `<!doctype html><html><head>
      <title>${input.title}</title>
      <meta name="description" content="${input.description}">
      <meta name="robots" content="${input.indexable === false ? "noindex, follow" : "index, follow"}">
      <link rel="canonical" href="${canonical}">
      ${schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join("")}
    </head><body><h1>${input.title.replace(/ \| Tùng Phát$/, "")}</h1>${input.completeDetail ? '<img src="https://cdn.mdftungphat.com/catalogue/301.webp" alt="301 Artistic Stripe"><a>Gửi mã 301 qua Zalo</a>' : ""}</body></html>`,
  };
}

describe("supplier static output audit", () => {
  it("accepts unique canonical pages with supplier-isolated brands", () => {
    const pages = [
      page({
        route: "/san-pham/laminate/thanh-thuy-lp-101/",
        supplierId: "thanh-thuy",
        brand: "Thanh Thuỳ",
        title: "Thanh Thuỳ LP 101 | Tùng Phát",
        description: "Tra cứu Laminate Thanh Thuỳ LP 101 tại Tùng Phát.",
      }),
      page({
        route: "/ma-mau-melamine/ba-thanh/bt-111/",
        supplierId: "ba-thanh",
        brand: "Ba Thanh",
        title: "Mã Melamine Ba Thanh BT 111 | Tùng Phát",
        description: "Tra cứu mã Melamine Ba Thanh BT 111 tại Tùng Phát.",
      }),
      page({
        route: "/catalogue/an-cuong/",
        supplierId: "an-cuong",
        brand: "An Cường",
        title: "Mã màu An Cường | Tùng Phát",
        description: "Tra cứu mã màu An Cường tại Tùng Phát.",
      }),
    ];

    const result = auditSupplierPages(pages, [
      "/san-pham/laminate/thanh-thuy-lp-101/",
      "/ma-mau-melamine/ba-thanh/bt-111/",
      "/catalogue/an-cuong/",
    ]);

    expect(result.errors).toEqual([]);
    expect(result.summary).toMatchObject({
      pages: 3,
      indexable: 3,
      noindex: 0,
      uniqueTitles: 3,
      uniqueDescriptions: 3,
      canonicalsChecked: 3,
      invalidJsonLd: 0,
      brandMismatches: 0,
      orphanIndexablePages: 0,
    });
  });

  it("detects duplicate metadata, canonical, sitemap and brand isolation failures", () => {
    const first = page({
      route: "/thuong-hieu/thanh-thuy/",
      supplierId: "thanh-thuy",
      brand: "Ba Thanh",
      title: "Catalogue trùng | Tùng Phát",
      description: "Mô tả trùng cho hai trang indexable.",
    });
    const second = page({
      route: "/ma-mau-melamine/ba-thanh/",
      supplierId: "ba-thanh",
      brand: "Ba Thanh",
      title: "Catalogue trùng | Tùng Phát",
      description: "Mô tả trùng cho hai trang indexable.",
    });
    second.html = second.html.replace(
      "https://mdftungphat.com/ma-mau-melamine/ba-thanh/",
      "https://mdftungphat.com/thuong-hieu/thanh-thuy/",
    );

    const result = auditSupplierPages(
      [first, second],
      [
        "/thuong-hieu/thanh-thuy/",
        "/ma-mau-melamine/ba-thanh/",
        "/catalogue/an-cuong/",
      ],
    );

    expect(result.errors.join("\n")).toMatch(/duplicate title/i);
    expect(result.errors.join("\n")).toMatch(/duplicate description/i);
    expect(result.errors.join("\n")).toMatch(/canonical mismatch/i);
    expect(result.errors.join("\n")).toMatch(/brand mismatch/i);
    expect(result.errors.join("\n")).toMatch(/no matching page/i);
  });

  it("enforces the pinned An Cuong Mã màu title and H1", () => {
    const anCuong = page({
      route: "/catalogue/an-cuong/",
      supplierId: "an-cuong",
      brand: "An Cường",
      title: "Mã bề mặt An Cường | Tùng Phát",
      description: "Tra cứu mã màu An Cường tại Tùng Phát.",
    });

    const result = auditSupplierPages([anCuong], ["/catalogue/an-cuong/"]);

    expect(result.errors.join("\n")).toMatch(/required title/i);
    expect(result.errors.join("\n")).toMatch(/required H1/i);
  });

  it("reports duplicate descriptions on noindex pages without treating them as cannibalization errors", () => {
    const first = page({
      route: "/catalogue/ba-thanh/",
      supplierId: "ba-thanh",
      brand: "Ba Thanh",
      title: "Catalogue Ba Thanh | Tùng Phát",
      description: "Nội dung placeholder đang được cập nhật.",
      indexable: false,
    });
    const second = page({
      route: "/san-pham/ba-thanh/",
      supplierId: "ba-thanh",
      brand: "Ba Thanh",
      title: "Sản phẩm Ba Thanh | Tùng Phát",
      description: "Nội dung placeholder đang được cập nhật.",
      indexable: false,
    });

    const result = auditSupplierPages([first, second], []);

    expect(result.errors).toEqual([]);
    expect(result.findings.duplicateNoindexDescriptions).toEqual([
      {
        value: "Nội dung placeholder đang được cập nhật.",
        routes: ["/catalogue/ba-thanh/", "/san-pham/ba-thanh/"],
      },
    ]);
  });

  it("accepts catalogue detail pages without Product schema when BreadcrumbList and SEO signals remain", () => {
    const detail = page({
      route: "/catalogue/thanh-thuy/melamine/301/",
      supplierId: "thanh-thuy",
      brand: "Thanh Thuỳ",
      title: "301 Artistic Stripe - Melamine Thanh Thuỳ | Tùng Phát",
      description: "Tra cứu mã 301 Artistic Stripe thuộc bảng Melamine Thanh Thuỳ.",
      productSchema: false,
      breadcrumbSchema: true,
      completeDetail: true,
    });

    const result = auditSupplierPages([detail], [detail.route]);

    expect(result.errors).toEqual([]);
  });

  it("rejects Product schema on unsupported catalogue detail pages", () => {
    const detail = page({
      route: "/catalogue/thanh-thuy/melamine/301/",
      supplierId: "thanh-thuy",
      brand: "Thanh Thuỳ",
      title: "301 Artistic Stripe - Melamine Thanh Thuỳ | Tùng Phát",
      description: "Tra cứu mã 301 Artistic Stripe thuộc bảng Melamine Thanh Thuỳ.",
      breadcrumbSchema: true,
      completeDetail: true,
    });

    const result = auditSupplierPages([detail], [detail.route]);

    expect(result.errors.join("\n")).toMatch(/unsupported Product schema/i);
  });
});
