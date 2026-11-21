import { SITE_URL } from "@/lib/seo";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import { decodeHTML } from "entities";

export type LlmsPage = {
  url: string;
  type: string;
  name: string;
  description: string;
  updatedAt?: string;
};

export type LlmsSource = {
  sitemapUrls: string[];
  pages: LlmsPage[];
  businessName: string;
  phone: string;
  zaloUrl: string;
  serviceAreas: string[];
};

type Link = { path: string; label: string; description: string };

const groups: { heading: string; links: Link[] }[] = [
  {
    heading: "Thông tin doanh nghiệp",
    links: [
      { path: "/", label: "Tùng Phát", description: "Tổng quan vật liệu gỗ, mã màu và gia công được công bố." },
      { path: "/chi-nhanh/14-tam-binh/", label: "Địa điểm 14 Tam Bình", description: "Địa chỉ và chỉ dẫn đến điểm liên hệ 14 Tam Bình." },
      { path: "/chi-nhanh/81b-tam-binh/", label: "Địa điểm 81B Tam Bình", description: "Địa chỉ và chỉ dẫn đến điểm liên hệ 81B Tam Bình." },
    ],
  },
  {
    heading: "Ván MDF và HDF",
    links: [
      { path: "/van-mdf/", label: "Ván MDF", description: "Đặc điểm của ván MDF và cách chọn theo hạng mục nội thất." },
      { path: "/van-hdf/", label: "Ván HDF", description: "Nhận biết HDF và phân biệt với MDF." },
      { path: "/van-go-cong-nghiep/", label: "Các nhóm ván công nghiệp", description: "Điểm bắt đầu để chọn cốt ván theo nhu cầu." },
      { path: "/san-pham/", label: "Danh mục sản phẩm", description: "Tổng hợp những nhóm vật liệu được công bố trên website." },
    ],
  },
  {
    heading: "MDF chống ẩm",
    links: [
      { path: "/mdf-chong-am/", label: "MDF chống ẩm LMR, MMR, HMR", description: "Các dòng MDF chống ẩm và lưu ý môi trường sử dụng." },
    ],
  },
  {
    heading: "Ván MFC và Okal",
    links: [
      { path: "/van-mfc/", label: "Ván MFC", description: "Ván dăm phủ Melamine và ứng dụng nội thất." },
      { path: "/van-okal/", label: "Ván dăm Okal", description: "Cấu tạo ván dăm và mối liên hệ với MFC." },
    ],
  },
  {
    heading: "Gỗ ghép",
    links: [
      { path: "/go-ghep/", label: "Gỗ ghép", description: "Chọn tấm gỗ ghép theo loại gỗ và hạng mục." },
      { path: "/go-ghep-cao-su/", label: "Gỗ ghép cao su", description: "Đặc điểm vân gỗ, bề mặt và ứng dụng." },
      { path: "/go-ghep-tram/", label: "Gỗ ghép tràm", description: "Đặc điểm gỗ tràm ghép và cách chọn tấm." },
    ],
  },
  {
    heading: "Plywood và vật liệu khác",
    links: [
      { path: "/van-plywood/", label: "Ván plywood", description: "Ván ép nhiều lớp, cấu tạo và công dụng." },
      { path: "/plywood-phu-melamine/", label: "Plywood phủ Melamine", description: "Phân biệt cốt plywood và lớp Melamine trang trí." },
      { path: "/van-nhua-pvc/", label: "Ván nhựa PVC", description: "Nhóm vật liệu ván nhựa và điều kiện sử dụng." },
    ],
  },
  {
    heading: "Bề mặt Melamine, Laminate, Acrylic và Veneer",
    links: [
      { path: "/melamine/", label: "Melamine", description: "Bề mặt Melamine và ứng dụng trên ván nền." },
      { path: "/laminate/", label: "Laminate", description: "Lớp phủ trang trí Laminate và cách phân biệt." },
      { path: "/acrylic/", label: "Acrylic", description: "Bề mặt Acrylic và lưu ý chọn ván nền, chỉ cạnh." },
      { path: "/tam-veneer/", label: "Veneer", description: "Lớp gỗ mỏng phủ trên cốt ván." },
      { path: "/pvc-film-pet/", label: "PVC Film và PET", description: "Các loại màng trang trí, cần chọn đúng dòng." },
      { path: "/chi-nep-nhua/", label: "Chỉ dán cạnh", description: "Chỉ nẹp hoàn thiện cạnh ván và mã bề mặt tương ứng." },
    ],
  },
];

const serviceLinks: Link[] = [
  { path: "/gia-cong-cnc/", label: "Dịch vụ gia công CNC", description: "Phạm vi cắt ván, CNC và hoàn thiện cạnh được công bố." },
  { path: "/cat-cnc-go/", label: "Cắt CNC gỗ", description: "Dịch vụ cắt CNC vật liệu gỗ theo yêu cầu." },
  { path: "/gia-cong-cnc-mdf/", label: "Gia công CNC MDF", description: "Gia công CNC trên MDF theo yêu cầu cụ thể." },
];

function clean(value: string, maxLength = 180): string {
  const text = decodeHTML(value)
    .replace(/<[^>]*>/gu, " ")
    .replace(/[\[\]()<>\r\n\t`*_~|\\]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  if (text.length <= maxLength) return text;
  const prefix = text.slice(0, maxLength);
  const sentenceEnd = Math.max(prefix.lastIndexOf(". "), prefix.lastIndexOf("? "), prefix.lastIndexOf("! "));
  if (sentenceEnd > maxLength / 2) return prefix.slice(0, sentenceEnd + 1);
  return `${prefix.slice(0, prefix.lastIndexOf(" ")).trim()}…`;
}

export function generateLlmsIndex(source: LlmsSource) {
  const valid = new Set(source.sitemapUrls);
  const pageDescriptions = new Map(source.pages.map((page) => [page.url, page]));
  const seen = new Set<string>();
  const included: string[] = [];
  const sections: string[] = [];
  const siteOrigin = new URL(SITE_URL).origin;

  function addLink(url: string, title: string, description: string) {
    if (!valid.has(url) || seen.has(url)) return "";
    const parsed = new URL(url);
    if (parsed.origin !== siteOrigin || parsed.search || parsed.hash || parsed.protocol !== "https:") return "";
    const detail = pageDescriptions.get(url);
    seen.add(url);
    included.push(url);
    return `- [${clean(title, 90)}](${url}): ${clean(description || detail?.description || "")}`;
  }

  for (const group of groups) {
    const lines = group.links.map(({ path, label, description }) =>
      addLink(new URL(path, siteOrigin).toString(), label, description),
    ).filter(Boolean);
    if (lines.length) sections.push(`## ${group.heading}\n\n${lines.join("\n")}`);
  }

  const materialNames: Record<string, string> = {
    melamine: "Melamine",
    laminate: "Laminate",
    acrylic: "Acrylic",
    veneer: "Veneer",
    "edge-banding": "chỉ dán cạnh",
  };
  const catalogueLines = [
    addLink(`${siteOrigin}/catalogue/`, "Tra cứu mã màu", "Chỉ mục mã màu và catalogue theo nhà cung cấp."),
  ];
  for (const supplier of supplierDefinitions) {
    catalogueLines.push(addLink(new URL(supplier.cataloguePath, siteOrigin).toString(),
      `Mã màu ${supplier.displayName}`, `Tra cứu các mã màu ${supplier.displayName} có trang công khai.`));
    for (const [material, label] of Object.entries(materialNames)) {
      catalogueLines.push(addLink(new URL(`${supplier.cataloguePath}${material}/`, siteOrigin).toString(),
        `${supplier.displayName} ${label}`, `Tra mã ${label} trong catalogue ${supplier.displayName}.`));
    }
  }
  if (catalogueLines.some(Boolean)) {
    sections.push(`## Catalogue và mã màu\n\n${catalogueLines.filter(Boolean).join("\n")}`);
  }

  const cncLines = serviceLinks.map(({ path, label, description }) =>
    addLink(new URL(path, siteOrigin).toString(), label, description),
  ).filter(Boolean);
  if (cncLines.length) sections.push(`## Cắt ván, gia công CNC và dán cạnh\n\n${cncLines.join("\n")}`);

  const articles = source.pages
    .filter((page) => page.type === "Article" && valid.has(page.url))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 36);
  const knowledgeLines = [
    addLink(`${siteOrigin}/bai-viet/`, "Bài viết kiến thức", "Các bài đã công bố về vật liệu và gia công."),
    ...articles.map((article) => addLink(article.url, article.name, article.description)),
  ].filter(Boolean);
  if (knowledgeLines.length) sections.push(`## Kiến thức vật liệu\n\n${knowledgeLines.join("\n")}`);

  const quoteLines = [
    addLink(`${siteOrigin}/lien-he/`, "Liên hệ Tùng Phát", "Địa chỉ và các kênh liên hệ chính thức."),
    addLink(`${siteOrigin}/bao-gia/`, "Thông tin báo giá", "Kênh trao đổi về loại vật liệu, quy cách và số lượng."),
  ].filter(Boolean);
  const zalo = new URL(source.zaloUrl);
  if (zalo.protocol === "https:" && zalo.hostname === "zalo.me") {
    quoteLines.push(`- [Nhắn Zalo Tùng Phát](${zalo.toString()}): Trao đổi nhu cầu vật liệu hoặc gia công và hỏi báo giá trực tiếp.`);
  }
  sections.push(`## Báo giá và liên hệ\n\n${quoteLines.join("\n")}`);

  const referenceLines = [
    `- [Sitemap](${SITE_URL}/sitemap.xml): Danh sách URL công khai đầy đủ, gồm trang chi tiết mã màu.`,
    `- [Knowledge JSON](${SITE_URL}/knowledge.json): Thông tin có cấu trúc cho những trang nội dung đã xuất bản.`,
  ];
  sections.push(`## Optional\n\n${referenceLines.join("\n")}`);

  const markdown = [
    "# MDF Tùng Phát — Ván gỗ công nghiệp, mã màu và gia công CNC",
    "",
    `> ${clean(source.businessName)} cung cấp thông tin về ván gỗ công nghiệp, vật liệu bề mặt, bảng mã màu và dịch vụ gia công CNC tại ${clean(source.serviceAreas.join(", "))}.`,
    "",
    "Tùng Phát là đơn vị cung ứng vật liệu và cung cấp dịch vụ gia công. Mã trong catalogue dùng để tra cứu mẫu bề mặt, không mặc nhiên xác nhận cốt ván, giá, tồn kho, khả năng giao hàng hoặc tư cách đại lý chính thức.",
    `Số liên hệ công bố: ${clean(source.phone)}. Khi cần báo giá, xác nhận đúng mã, loại ván, độ dày, số lượng và yêu cầu gia công qua Zalo hoặc trang liên hệ.`,
    "",
    ...sections.flatMap((section) => [section, ""]),
  ].join("\n").trimEnd() + "\n";
  if (Buffer.byteLength(markdown, "utf8") > 18_000) throw new Error("llms.txt exceeds 18 KB curated index budget");
  if (included.length < 10) throw new Error("Too few verified public URLs for llms.txt");
  return { markdown, included, omitted: valid.size - included.length };
}
