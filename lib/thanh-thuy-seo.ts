import type { Metadata } from "next";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { absoluteMediaUrl } from "@/lib/media";
import { createPageMetadata, SITE_URL, ZALO_URL } from "@/lib/seo";
import type { ThanhThuyCategory } from "@/lib/thanh-thuy";

export type ThanhThuySeoRecord = {
  slug?: string;
  code?: string;
  name: string;
  categorySlug?: string;
  categoryName?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  image?: string;
  seoStatus?: string;
  published?: boolean;
  price?: number | null;
};

function isIndexable(record: ThanhThuySeoRecord): boolean {
  return (
    record.published !== false &&
    (record.seoStatus === undefined || record.seoStatus === "READY_TO_INDEX")
  );
}

function productTitle(record: ThanhThuySeoRecord): string {
  const code = record.code?.trim();
  const identity =
    code && !record.name.toLowerCase().includes(code.toLowerCase())
      ? `${record.name} ${code}`
      : record.name;
  return `${identity} Thanh Thùy | Tùng Phát`;
}

function productDescription(record: ThanhThuySeoRecord): string {
  if (record.seoDescription?.trim()) return record.seoDescription.trim();
  const category = record.categoryName
    ? `${record.categoryName} `
    : "sản phẩm ";
  const code = record.code ? ` mã ${record.code}` : "";
  return `Tham khảo ${category}Thanh Thùy${code}, xem mẫu và thông tin đang có trước khi hỏi cốt ván, quy cách hoặc phần gia công.`;
}

export function createThanhThuyMetadata(
  record: ThanhThuySeoRecord,
  path: string,
): Metadata {
  const title = record.seoTitle?.trim() || productTitle(record);
  const description = productDescription(record);
  const metadata = createPageMetadata({
    title,
    description,
    path,
    noIndex: !isIndexable(record),
  });
  if (!record.image) return metadata;
  const image = absoluteMediaUrl(record.image, SITE_URL);
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [{ url: image, alt: record.name }],
    },
    twitter: {
      ...metadata.twitter,
      images: [image],
    },
  };
}

type ThanhThuyCategoryCopy = {
  description: string;
  metaDescription: string;
  applications: Array<{ title: string; description: string }>;
  guidance: string;
  ctaLabel: string;
};

const categoryCopy: Record<string, ThanhThuyCategoryCopy> = {
  laminate: {
    description:
      "Laminate Thanh Thuỳ được chia thành LE Đơn Sắc, LE Vân Gỗ, LP Đơn Sắc, LP Vân Gỗ và LP Vân Đá - Vân Vải. Chọn nhóm trước để đi đến đúng mã đang tìm.",
    metaDescription:
      "Tra cứu Laminate Thanh Thuỳ theo LE/LP, đơn sắc, vân gỗ và vân đá - vân vải. Gửi mã, quy cách hoặc file nếu cần hỏi phần gia công.",
    applications: [
      { title: "Tủ và hệ kệ nội thất", description: "Các mã được gom theo nhóm LE và LP để tìm nhanh màu hoặc vân đang cần." },
      { title: "Bề mặt và vách trang trí", description: "Gửi mã cùng kích thước, số lượng và phần cắt nếu đã có bản vẽ." },
      { title: "Chọn theo nhóm mã", description: "Có thể bắt đầu từ đơn sắc, vân gỗ hoặc vân đá - vân vải rồi mở từng mã." },
    ],
    guidance:
      "Bạn đã có mã Laminate thì gửi nguyên mã, ảnh mẫu nếu có, cốt ván, kích thước và số lượng. Nếu cần dán cạnh hoặc CNC, ghi rõ phần việc trong tin nhắn.",
    ctaLabel: "Gửi mã Laminate qua Zalo",
  },
  melamine: {
    description:
      "Melamine Thanh Thuỳ gồm Vân Gỗ, Vân Đá - Vải và Vân Đơn Sắc; nhóm Vân Gỗ có thêm Cherry, Elm, Maple, Beech, Oak và Walnut.",
    metaDescription:
      "Tra cứu mã Melamine Thanh Thuỳ theo vân gỗ, vân đá - vải và đơn sắc; mở nhanh các nhánh Cherry, Oak, Walnut rồi gửi mã cần hỏi.",
    applications: [
      { title: "Tủ và hệ kệ nội thất", description: "Đây là các hạng mục đang có trong thông tin ứng dụng của nhóm mã Melamine." },
      { title: "Bề mặt và vách trang trí", description: "Chọn nhóm vân trước, sau đó gửi mã và kích thước chi tiết cần làm." },
      { title: "Tra cứu nhánh vân gỗ", description: "Mở Cherry, Elm, Maple, Beech, Oak hoặc Walnut khi đã biết nhóm vân." },
    ],
    guidance:
      "Gửi mã Melamine kèm cốt ván, độ dày, kích thước và số lượng. Nếu cần phối chỉ nẹp hoặc làm CNC, gửi thêm mã cạnh và file nếu có.",
    ctaLabel: "Gửi mã Melamine qua Zalo",
  },
  acrylic: {
    description:
      "Acrylic Thanh Thuỳ hiện có hai nhóm Glass Series và Ultra Series. Dùng bộ lọc để xem mã, tên nhóm và mẫu trước khi gửi yêu cầu.",
    metaDescription:
      "Xem mã Acrylic Thanh Thuỳ thuộc Glass Series và Ultra Series, kèm mẫu và hướng gửi mã cho cánh, vách hoặc chi tiết nội thất.",
    applications: [
      { title: "Tủ và hệ kệ nội thất", description: "Thông tin ứng dụng của các mã Acrylic hiện tập trung vào tủ và hệ kệ." },
      { title: "Bề mặt và vách trang trí", description: "Gửi mã cùng kích thước cánh hoặc vách để trao đổi phần vật liệu cần làm." },
      { title: "Glass Series và Ultra Series", description: "Chọn đúng series trước khi mở từng mã Acrylic trong bảng." },
    ],
    guidance:
      "Acrylic đang có hai series chính. Gửi mã hoặc tên series cùng kích thước, cốt ván và số lượng; nếu có file, gửi luôn để trao đổi hướng gia công.",
    ctaLabel: "Gửi mã Acrylic qua Zalo",
  },
  "pvc-film": {
    description:
      "PVC Film Thanh Thuỳ được tách thành Vân Đá - Vải, Đơn Sắc, Vân Gỗ và Màng Pet Bóng. Chọn nhóm theo loại vân trước khi mở mã.",
    metaDescription:
      "Tra cứu PVC Film Thanh Thuỳ theo vân gỗ, đơn sắc, vân đá - vải và Màng Pet Bóng; gửi mã kèm kích thước chi tiết cần hỏi.",
    applications: [
      { title: "Bề mặt cánh tủ", description: "Thông tin ứng dụng của nhóm mã tập trung vào bề mặt cánh tủ." },
      { title: "Chi tiết nội thất tạo hình", description: "Nếu chi tiết có tạo hình, gửi ảnh hoặc file cùng mã PVC Film." },
      { title: "Bốn nhóm đang có", description: "Tìm theo Vân Đá - Vải, Đơn Sắc, Vân Gỗ hoặc Màng Pet Bóng." },
    ],
    guidance:
      "Gửi mã PVC Film, loại chi tiết, kích thước và số lượng. Nếu cần tạo hình, gửi thêm ảnh hoặc file để trao đổi nền vật liệu và cách làm.",
    ctaLabel: "Gửi mã PVC Film qua Zalo",
  },
  veneer: {
    description:
      "Trang Tấm Veneer Thanh Thuỳ hiện có 3 mã cho bề mặt nội thất, vách và đồ gỗ trang trí. Mở từng mã để xem thông tin đang có.",
    metaDescription:
      "Xem 3 mã Tấm Veneer Thanh Thuỳ cho bề mặt nội thất, vách và đồ gỗ; gửi mã, hướng vân và độ dày cần hỏi.",
    applications: [
      { title: "Bề mặt nội thất", description: "Các mã trong bảng được ghi nhận cho bề mặt nội thất." },
      { title: "Vách và đồ gỗ trang trí", description: "Chọn mã theo hạng mục, mặt sử dụng và hướng vân cần thể hiện." },
      { title: "Xem độ dày theo mã", description: "Độ dày chỉ hiển thị ở những mã có thông tin nguồn tương ứng." },
    ],
    guidance:
      "Gửi mã Veneer cùng mặt sử dụng, hướng vân, độ dày và kích thước. Nên xem mẫu thật trước khi chốt tấm và cách hoàn thiện.",
    ctaLabel: "Gửi mã Veneer qua Zalo",
  },
  "chi-nep-nhua": {
    description:
      "Trang Chỉ nẹp nhựa Thanh Thuỳ hiện có các mã màu đen, trắng và vân gỗ, dùng cho hoàn thiện cạnh ván và phối màu bề mặt nội thất.",
    metaDescription:
      "Xem mã Chỉ nẹp nhựa Thanh Thuỳ màu đen, trắng và vân gỗ; gửi mã bề mặt đi kèm nếu cần phối cạnh cho tấm ván.",
    applications: [
      { title: "Hoàn thiện cạnh ván", description: "Nhóm mã được ghi nhận cho phần cạnh của tấm ván nội thất." },
      { title: "Phối màu bề mặt", description: "Gửi mã bề mặt đi kèm để hỏi hướng phối cạnh phù hợp." },
      { title: "Đen, trắng và vân gỗ", description: "Mở từng mã để xem tên và hình mẫu đang có trong bảng." },
    ],
    guidance:
      "Gửi mã bề mặt cùng mã chỉ nẹp, kích thước cạnh và số lượng. Có ảnh mẫu thì gửi kèm để trao đổi màu trước khi dán cạnh.",
    ctaLabel: "Gửi mã chỉ nẹp qua Zalo",
  },
};

export function getThanhThuyCategoryCopy(
  category: Pick<ThanhThuyCategory, "slug" | "name">,
) {
  return (
    categoryCopy[category.slug] ?? {
      description: `${category.name} Thanh Thuỳ được sắp theo mã và nhóm bề mặt để bạn mở đúng danh mục trước khi hỏi vật liệu.`,
      metaDescription: `Xem mã ${category.name} Thanh Thuỳ theo nhóm bề mặt và gửi mã cần hỏi.`,
      applications: [
        { title: "Mã và nhóm bề mặt", description: "Mở danh sách để xem tên, nhóm và hình mẫu của từng mã." },
        { title: "Hạng mục nội thất", description: "Gửi hạng mục, kích thước và số lượng nếu cần hỏi thêm." },
      ],
      guidance: "Gửi mã sản phẩm, kích thước và quy cách dự kiến nếu cần hỏi phần vật liệu hoặc gia công.",
      ctaLabel: `Gửi mã ${category.name} qua Zalo`,
    }
  );
}

export function createThanhThuyCategoryMetadata(
  category: Pick<ThanhThuyCategory, "slug" | "name">,
  path: string,
): Metadata {
  const copy = getThanhThuyCategoryCopy(category);
  return createPageMetadata({
    title: `${category.name} Thanh Thuỳ`,
    description: copy.metaDescription,
    path,
  });
}

export function createThanhThuyBrandMetadata(): Metadata {
  return createPageMetadata({
    title: "Thanh Thuỳ | Tra cứu mã màu và vật liệu",
    description:
      "Tra cứu Melamine, Laminate, Acrylic, PVC Film, Veneer và chỉ nẹp nhựa Thanh Thuỳ tại Tùng Phát. Gửi mã để kiểm tra mẫu, tồn kho, báo giá và gia công.",
    path: "/thuong-hieu/thanh-thuy/",
  });
}

export function thanhThuyZaloUrl(code?: string): string {
  return buildSupplierZaloInquiryUrl(ZALO_URL, "Thanh Thuỳ", code);
}
