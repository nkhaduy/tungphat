import type { Metadata } from "next";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { absoluteUrl, createPageMetadata, ZALO_URL } from "@/lib/seo";
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
  return `Tham khảo ${category}Thanh Thùy${code} tại Tùng Phát. Liên hệ kiểm tra mẫu thực tế, quy cách, tồn kho và phương án gia công trước khi đặt.`;
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
  const image = absoluteUrl(record.image);
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

const categoryCopy: Record<
  string,
  { description: string; applications: string[]; guidance: string }
> = {
  laminate: {
    description:
      "Laminate Thanh Thuỳ là lớp phủ bề mặt dùng cho các hạng mục nội thất cần hình ảnh ổn định, dễ vệ sinh và có nhiều lựa chọn vân màu.",
    applications: [
      "Cánh tủ và tủ bếp",
      "Mặt bàn, quầy và vách",
      "Nội thất văn phòng và thương mại",
    ],
    guidance:
      "Khi chọn mã, hãy đối chiếu nhóm vân, tông màu và độ dày tấm nền dự kiến; gửi mã cho Tùng Phát để kiểm tra mẫu trước khi gia công.",
  },
  melamine: {
    description:
      "Melamine Thanh Thuỳ phù hợp cho các bề mặt ván nội thất cần phối màu nhanh, đồng bộ giữa tấm và chỉ nẹp, với lựa chọn vân gỗ, vân đá và màu đơn sắc.",
    applications: [
      "Tủ quần áo, tủ bếp và hệ kệ",
      "Bàn, vách và quầy",
      "Nội thất căn hộ, văn phòng",
    ],
    guidance:
      "Nên chọn đồng thời mã bề mặt và mã chỉ nẹp, sau đó xác nhận màu dưới ánh sáng thực tế trước khi cắt ván.",
  },
  acrylic: {
    description:
      "Acrylic Thanh Thuỳ tạo bề mặt liền mạch, phù hợp các thiết kế cần màu rõ và cảm giác hiện đại; việc phối tấm nền và cạnh cần được xác nhận trước khi sản xuất.",
    applications: [
      "Cánh tủ và đảo bếp",
      "Quầy, vách và đồ nội thất hiện đại",
      "Chi tiết cần bề mặt nổi bật",
    ],
    guidance:
      "Hãy gửi mã cùng kích thước chi tiết để Tùng Phát tư vấn hướng cắt, dán cạnh và kiểm tra khả năng cung ứng.",
  },
  "pvc-film": {
    description:
      "PVC Film Thanh Thuỳ là nhóm bề mặt dùng cho chi tiết nội thất tạo hình và các hạng mục cần lựa chọn vân màu linh hoạt.",
    applications: [
      "Cánh tủ và chi tiết bo cong",
      "Mặt trang trí và vách",
      "Hạng mục nội thất cần đồng bộ vân",
    ],
    guidance:
      "Cần xác nhận nền vật liệu, bán kính tạo hình và điều kiện gia công trước khi chốt mã.",
  },
  veneer: {
    description:
      "Tấm Veneer Thanh Thuỳ mang cảm giác gỗ tự nhiên cho bề mặt nội thất; màu và vân nên được đối chiếu bằng mẫu thật trước khi thi công.",
    applications: [
      "Cánh tủ và vách trang trí",
      "Mặt bàn, quầy và đồ gỗ",
      "Không gian cần sắc thái gỗ tự nhiên",
    ],
    guidance:
      "Mỗi mã veneer có thể khác nhau theo tấm và hướng vân; nên duyệt mẫu thực tế và quy cách hoàn thiện trước khi đặt.",
  },
  "chi-nep-nhua": {
    description:
      "Chỉ nẹp nhựa Thanh Thuỳ giúp hoàn thiện cạnh ván và tạo sự đồng bộ với nhóm màu, vân của bề mặt nội thất.",
    applications: [
      "Dán cạnh ván MDF/MFC",
      "Cánh tủ, kệ và vách",
      "Hạng mục cần che mép cắt",
    ],
    guidance:
      "Gửi mã bề mặt đi kèm mã chỉ nẹp để Tùng Phát kiểm tra độ tương đồng màu trước khi dán cạnh.",
  },
};

export function getThanhThuyCategoryCopy(
  category: Pick<ThanhThuyCategory, "slug" | "name">,
) {
  return (
    categoryCopy[category.slug] ?? {
      description: `${category.name} Thanh Thuỳ được Tùng Phát tổng hợp theo mã và nhóm bề mặt để khách hàng dễ tra cứu trước khi đặt vật liệu.`,
      applications: [
        "Hạng mục nội thất theo thiết kế",
        "Tủ, bàn, vách hoặc quầy",
      ],
      guidance:
        "Gửi mã sản phẩm và quy cách dự kiến để Tùng Phát kiểm tra mẫu, tồn kho và phương án gia công.",
    }
  );
}

export function createThanhThuyCategoryMetadata(
  category: Pick<ThanhThuyCategory, "slug" | "name">,
  path: string,
): Metadata {
  const copy = getThanhThuyCategoryCopy(category);
  return createPageMetadata({
    title: `${category.name} Thanh Thuỳ tại Tùng Phát`,
    description: `${copy.description} Liên hệ Tùng Phát tại TP.HCM để kiểm tra mã và báo giá.`,
    path,
  });
}

export function createThanhThuyBrandMetadata(): Metadata {
  return createPageMetadata({
    title: "Thanh Thuỳ tại Tùng Phát | Tra cứu mã màu và vật liệu",
    description:
      "Tra cứu Melamine, Laminate, Acrylic, PVC Film, Veneer và chỉ nẹp nhựa Thanh Thuỳ tại Tùng Phát. Gửi mã để kiểm tra mẫu, tồn kho, báo giá và gia công.",
    path: "/thuong-hieu/thanh-thuy/",
  });
}

export function thanhThuyZaloUrl(code?: string): string {
  return buildSupplierZaloInquiryUrl(ZALO_URL, "Thanh Thuỳ", code);
}
