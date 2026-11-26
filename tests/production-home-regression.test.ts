import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeHero } from "@/components/home/HomeHero";
import { metadata as homepageMetadata } from "@/app/page";
import { getProducts } from "@/lib/content";
import type { ContentEntry } from "@/lib/content";
import type { ProductFrontmatter } from "@/lib/content-schema";
import { createContentMetadata } from "@/lib/content-metadata";
import { mergeProductEditorial } from "@/lib/product-editorial";
import { MaterialLanding } from "@/components/products/MaterialLanding";
import { getMaterialEditorial } from "@/lib/product-editorial";
import * as productTaxonomy from "@/lib/product-taxonomy";
import { afterEach, describe, expect, it, vi } from "vitest";

type ApprovedHomeCard = { title: string; href: string; image: string };
const homeProductCards = (productTaxonomy as typeof productTaxonomy & { homeProductCards?: ApprovedHomeCard[] }).homeProductCards ?? [];

const approvedCards = [
  ["Ván MDF – HDF", "/van-mdf/"],
  ["MDF chống ẩm (LMR – MMR – HMR)", "/mdf-chong-am/"],
  ["Ván Okal – MFC (Ván dăm)", "/van-okal/"],
  ["Ván ép – Plywood", "/van-plywood/"],
  ["Gỗ ghép cao su", "/go-ghep-cao-su/"],
  ["Melamine", "/melamine/"],
  ["Laminate", "/laminate/"],
  ["Ván phủ Veneer", "/tam-veneer/"],
  ["Ván nhựa", "/van-nhua-pvc/"],
  ["Chỉ dán cạnh", "/chi-nep-nhua/"],
];

const heroDescription = "Tùng Phát chuyên cung cấp đa dạng vật liệu gỗ công nghiệp như MDF, MFC, HDF, Plywood cùng các dòng bề mặt Melamine, Laminate, Acrylic. Đồng thời, nhận cắt ván, gia công CNC và dán chỉ cạnh theo bản vẽ hoặc yêu cầu của khách hàng.";
const homepageMetaDescription = "Chọn ván, bề mặt Thanh Thùy, Ba Thanh và dịch vụ cắt/CNC tại Tùng Phát, Thủ Đức. Tra mã màu rồi gửi quy cách để nhận báo giá.";
const fallbackProductSlugs = [
  "acrylic", "chi-nep-nhua", "laminate", "melamine", "plywood-phu-melamine", "pvc-film-pet",
  "tam-veneer", "van-hdf", "van-mfc", "van-nhua-pvc", "van-okal", "van-plywood",
];

afterEach(() => vi.unstubAllGlobals());

describe("production homepage baseline", () => {
  it("keeps the approved ten product cards and responsive media in their approved order", () => {
    expect(homeProductCards.map(({ title, href }) => [title, href])).toEqual(approvedCards);
    expect(homeProductCards.every(({ image }) => image.startsWith("/sanpham-media/"))).toBe(true);
  });

  it("renders the exact pre-release hero H1 and description", () => {
    const html = renderToStaticMarkup(createElement(HomeHero));
    const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
    const visibleHeading = heading
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

    expect(visibleHeading).toBe("Ván gỗ công nghiệp& gia công CNC");
    expect(html).toContain(heroDescription);
  });

  it("keeps the approved homepage SEO title and description", () => {
    expect(homepageMetadata.title).toEqual({ absolute: "Tùng Phát | Ván gỗ công nghiệp & Gia công CNC tại Thủ Đức" });
    expect(homepageMetadata.description).toBe(homepageMetaDescription);
  });

  it("restores the reviewed material-guide routes without exposing CMS-managed records", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ docs: [], hasNextPage: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
    const products = await getProducts();
    expect(products.map(({ slug }) => slug).sort()).toEqual(fallbackProductSlugs);
    expect(products.find(({ slug }) => slug === "van-hdf")?.canonical).toBe("https://gotungphat.com/van-hdf/");
  });

  it("keeps CMS media when the reviewed local taxonomy has no replacement", () => {
    const cmsProduct = {
      title: "Gỗ ghép tràm",
      slug: "go-ghep-tram",
      category: "Ván và vật liệu",
      materialType: "Gỗ ghép tràm",
      supplier: "",
      dimensions: [],
      thicknesses: [],
      surfaces: [],
      standards: [],
      applications: ["Mặt bàn và kệ nội thất"],
      advantages: ["Tấm ghép có vân gỗ tự nhiên"],
      limitations: ["Chọn theo điều kiện sử dụng"],
      orderingSteps: ["Gửi quy cách và số lượng để hỏi hàng"],
      excerpt: "Gỗ ghép tràm được tạo từ các thanh gỗ ghép thành tấm, mỗi tấm có màu và vân khác nhau.",
      featuredImage: "https://cdn.mdftungphat.com/uploads/hero-workshop5.webp",
      featuredImageAlt: "Ảnh xưởng Tùng Phát và ván gỗ ghép tràm",
      gallery: [],
      video: "",
      catalogue: "",
      ogImage: "",
      status: "available",
      quoteCta: "Gửi yêu cầu báo giá",
      publishedAt: "2026-11-01",
      updatedAt: "2026-11-14",
      draft: false,
      featured: false,
      seoTitle: "Gỗ ghép tràm tại TP.HCM: kiểm tra quy cách",
      seoDescription: "Tìm hiểu cách chọn gỗ ghép tràm theo phân hạng, bề mặt và quy cách. Liên hệ để kiểm tra dòng hàng và báo giá thực tế.",
      canonical: "https://mdftungphat.com/go-ghep-tram",
      noindex: false,
      faq: [],
      relatedArticles: [],
      body: "Nội dung hiện có từ CMS.",
      sourcePath: "payload://products/go-ghep-tram",
      mediaMetadata: { featuredImage: { width: 1915, height: 821, type: "image/webp" } },
    } as unknown as ContentEntry<ProductFrontmatter>;

    const product = mergeProductEditorial([cmsProduct]).find(({ slug }) => slug === "go-ghep-tram");
    expect(product?.featuredImage).toBe(cmsProduct.featuredImage);
    expect(product?.featuredImageAlt).toBe(cmsProduct.featuredImageAlt);
    expect(product?.mediaMetadata?.featuredImage).toEqual(cmsProduct.mediaMetadata.featuredImage);
    expect(() => createContentMetadata(product!, "/go-ghep-tram")).not.toThrow();
    const markup = renderToStaticMarkup(createElement(MaterialLanding, { product: product!, editorial: getMaterialEditorial("go-ghep-tram")! }));
    expect(markup).toContain('"@type":"Product"');

    const guide = mergeProductEditorial([]).find(({ slug }) => slug === "van-hdf");
    const guideMarkup = renderToStaticMarkup(createElement(MaterialLanding, { product: guide!, editorial: getMaterialEditorial("van-hdf")! }));
    expect(guideMarkup).toContain('"@type":"CollectionPage"');
    expect(guideMarkup).not.toContain('"@type":"Product"');
  });
});
