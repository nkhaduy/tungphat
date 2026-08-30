import legacyData from "@/data/catalogs/ba-thanh.json";
import { getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import type { SupplierColorCode } from "@/lib/catalog/types";
import type { PublicSupplierColorCode, SupplierColorImageRole } from "@/lib/catalog/color-codes/types";
import {
  normalizeBaThanhSearch,
  sortBaThanhCodesByDemand,
} from "@/lib/catalog/ba-thanh-search";

export {
  getBaThanhMerchandisingScore,
  normalizeBaThanhSearch,
  sortBaThanhCodesByDemand,
} from "@/lib/catalog/ba-thanh-search";

export type BaThanhCategory = {
  slug: string;
  label: string;
  sourceLabel: string;
  count: number;
  intro: string;
  applications: string[];
  choosing: string;
};

export const BA_THANH_DISCLAIMER =
  "Màu hiển thị có thể thay đổi theo màn hình, ánh sáng và điều kiện chụp. Vui lòng đối chiếu mẫu hoặc catalogue thực tế trước khi đặt hàng.";

const categoryCopy: Record<string, Omit<BaThanhCategory, "slug" | "count">> = {
  "van-go": {
    label: "Vân gỗ",
    sourceLabel: "MÀU VÂN GỖ",
    intro:
      "Nhóm vân gỗ Ba Thanh giúp tra nhanh các mã bề mặt có đường vân dùng cho tủ, kệ, vách và chi tiết nội thất. Tùng Phát hỗ trợ kiểm tra cốt ván, khổ cắt và dán cạnh theo từng mã.",
    applications: [
      "Tủ áo, tủ lưu trữ và hệ kệ",
      "Cánh tủ, vách và đồ nội thất",
      "Chi tiết cần cắt ván hoặc CNC",
    ],
    choosing:
      "Nên gửi mã kèm hướng vân, kích thước chi tiết và loại MDF/MFC mong muốn để hạn chế nhầm giữa mã gần nhau.",
  },
  "don-sac": {
    label: "Đơn sắc",
    sourceLabel: "MÀU ĐƠN SẮC",
    intro:
      "Nhóm đơn sắc Ba Thanh phù hợp khi thiết kế cần một bề mặt phẳng, dễ phối với vân gỗ hoặc dùng đồng nhất trên nhiều chi tiết. Mã và biến thể hậu tố được giữ nguyên để đối chiếu.",
    applications: [
      "Cánh tủ và hộc kéo",
      "Tủ bếp, bàn và kệ",
      "Mảng màu phối cùng vân gỗ",
    ],
    choosing:
      "Không nên suy ra màu chính xác từ màn hình; hãy xác nhận mã, bề mặt và mẫu thực tế trước khi chốt sản xuất.",
  },
  "van-da": {
    label: "Vân đá",
    sourceLabel: "MÀU VÂN ĐÁ",
    intro:
      "Nhóm vân đá Ba Thanh dùng để tham khảo các mã có họa tiết dạng đá cho quầy, mặt bàn, vách và điểm nhấn nội thất. Hướng vân và cách ghép tấm cần được thống nhất trước khi cắt.",
    applications: [
      "Quầy, mặt bàn và đảo bếp",
      "Vách trang trí và mảng điểm nhấn",
      "Chi tiết CNC cần định hướng vân",
    ],
    choosing:
      "Hãy cung cấp kích thước triển khai và vị trí ghép để Tùng Phát kiểm tra khổ ván, hao hụt và cách dán cạnh phù hợp.",
  },
  "van-vai": {
    label: "Vân vải",
    sourceLabel: "MÀU VÂN VẢI",
    intro:
      "Nhóm vân vải Ba Thanh tạo lựa chọn bề mặt có cảm giác dệt cho vách, cánh và các mảng nội thất cần sắc thái mềm hơn vân gỗ hoặc đơn sắc.",
    applications: [
      "Vách và cánh tủ",
      "Hệ kệ và mảng trang trí",
      "Nội thất cần bề mặt có cảm giác textile",
    ],
    choosing:
      "Nên đối chiếu mẫu vật liệu và thống nhất chiều vân trước khi đặt cắt, dán cạnh hoặc gia công CNC.",
  },
  khac: {
    label: "Khác",
    sourceLabel: "MÃ CÔNG KHAI KHÁC",
    intro:
      "Nhóm này giữ các mã Melamine được supplier công khai nhưng chưa gắn vào nhóm vân gỗ, đơn sắc, vân đá hoặc vân vải.",
    applications: ["Đối chiếu mã supplier", "Gửi mã để kiểm tra mẫu thực tế"],
    choosing:
      "Không suy ra nhóm vân hoặc màu từ ảnh; hãy gửi nguyên mã để Tùng Phát kiểm tra lại với supplier.",
  },
};

const legacyRecords = legacyData as SupplierColorCode[];
const legacyByCode = new Map(legacyRecords.map((record) => [record.codeNormalized, record]));
const publicRecords = getPublicColorCodes()
  .filter((record) => record.supplier === "ba-thanh" && record.materialType === "melamine");

function categoryForPattern(pattern?: string): string {
  const value = (pattern ?? "").toLowerCase();
  if (value.includes("vân gỗ")) return "van-go";
  if (value.includes("đơn sắc")) return "don-sac";
  if (value.includes("vân đá")) return "van-da";
  if (value.includes("vân vải")) return "van-vai";
  return "khac";
}

function legacyImageType(role: SupplierColorImageRole): SupplierColorCode["images"][number]["type"] {
  if (role === "swatch") return "swatch";
  if (role === "application" || role === "actual-photo") return "real-photo";
  return "other";
}

function toLegacyRecord(record: PublicSupplierColorCode): SupplierColorCode {
  const legacy = legacyByCode.get(record.codeNormalized);
  const displayName = legacy?.displayName ?? record.searchAliases.find((alias) => alias !== record.codeRaw && /\s/.test(alias)) ?? record.codeRaw;
  return {
    ...(legacy ?? {
      id: record.id,
      supplier: "ba-thanh" as const,
      brandName: "Ba Thanh" as const,
      codeRaw: record.codeRaw,
      codeNormalized: record.codeNormalized,
      displayName,
      slug: record.slug,
      category: categoryForPattern(record.patternType),
      sourceUrl: record.sourceUrl,
      sourceIndexUrl: record.sourceColorMapUrl ?? "https://bathanh.com.vn/map-ma-melamine",
      sourceImportedAt: "2026-08-07T00:00:00.000Z",
      sourceChecksum: "",
      sourceData: {},
      images: [],
      seoStatus: "NEEDS_ENRICHMENT" as const,
      published: false,
    }),
    id: record.id,
    codeRaw: record.codeRaw,
    codeNormalized: record.codeNormalized,
    displayName,
    slug: record.slug,
    category: categoryForPattern(record.patternType),
    patternGroup: record.patternType,
    sourceUrl: record.sourceUrl,
    sourceIndexUrl: record.sourceColorMapUrl ?? "https://bathanh.com.vn/map-ma-melamine",
    images: record.images
      .filter((image) => image.localPath)
      .map((image) => ({
        type: legacyImageType(image.role),
        src: image.localPath!,
        localPath: image.localPath,
        checksum: image.checksum,
        originalUrl: image.originalUrl,
        originalPath: image.originalPath,
        originalWidth: image.originalWidth,
        originalHeight: image.originalHeight,
        originalBytes: image.originalBytes,
        originalMimeType: image.originalMimeType,
        originalChecksum: image.originalChecksum,
        alt: `${displayName} Ba Thanh`,
        width: image.width,
        height: image.height,
      })),
    seoStatus: record.seoStatus === "READY_TO_INDEX" ? "READY_TO_INDEX" : "NEEDS_ENRICHMENT",
    published: record.seoStatus === "READY_TO_INDEX",
  };
}

const records = publicRecords.map(toLegacyRecord);

export const baThanhCategories: BaThanhCategory[] = Object.entries(
  categoryCopy,
).map(([slug, copy]) => ({
  slug,
  ...copy,
  count: records.filter((record) => record.category === slug).length,
}));

export function getBaThanhCodes() {
  return records;
}

export function getBaThanhCode(slug: string) {
  const normalized = normalizeBaThanhSearch(slug);
  return records.find((record) => record.slug === slug || record.codeNormalized === normalized);
}

export function getBaThanhCategory(slug: string) {
  return baThanhCategories.find((category) => category.slug === slug);
}

export function getBaThanhIndexableCodes() {
  return records.filter(
    (record) => record.seoStatus === "READY_TO_INDEX" && record.published,
  );
}

export function getBaThanhHubFeaturedCodes() {
  return sortBaThanhCodesByDemand(getBaThanhIndexableCodes());
}

export function getBaThanhCanonicalRoute(record: SupplierColorCode): string {
  const canonical = publicRecords.find((item) => item.codeNormalized === record.codeNormalized);
  return canonical?.canonicalRoute ?? `/catalogue/ba-thanh/melamine/${record.slug}/`;
}

export function searchBaThanhCodes(query: string, category?: string) {
  const needle = normalizeBaThanhSearch(query);
  const categoryNeedle = category ? normalizeBaThanhSearch(category) : "";
  return sortBaThanhCodesByDemand(
    records.filter((record) => {
      if (category && record.category !== category) return false;
      if (!needle && !categoryNeedle) return true;
      const haystack = normalizeBaThanhSearch(
        `${record.displayName} ${record.codeRaw} ${record.codeNormalized} ${record.patternGroup || ""} ${record.category}`,
      );
      return !needle || haystack.includes(needle);
    }),
  );
}

export function getBaThanhSearchIndex() {
  return records.map((record) => ({
    slug: record.slug,
    displayName: record.displayName,
    codeNormalized: record.codeNormalized,
    category: record.category,
    patternGroup: record.patternGroup || "",
    seoStatus: record.seoStatus,
  }));
}
