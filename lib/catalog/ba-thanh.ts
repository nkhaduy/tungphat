import data from "@/data/catalogs/ba-thanh.json";
import type { SupplierColorCode } from "@/lib/catalog/types";

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
};

const records = data as SupplierColorCode[];

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
  return records.find((record) => record.slug === slug);
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

type BaThanhMerchandisingRecord = Pick<
  SupplierColorCode,
  "displayName" | "category" | "images" | "seoStatus"
>;

const categoryDemandWeights: Record<string, number> = {
  "van-go": 36,
  "don-sac": 32,
  "van-da": 24,
  "van-vai": 18,
};

export function getBaThanhMerchandisingScore(
  record: BaThanhMerchandisingRecord,
): number {
  return (
    (record.seoStatus === "READY_TO_INDEX" ? 100 : 0) +
    (categoryDemandWeights[record.category] ?? 0) +
    (record.images.length ? 12 : 0) +
    (record.displayName.trim() ? 8 : 0)
  );
}

export function sortBaThanhCodesByDemand<
  Record extends BaThanhMerchandisingRecord,
>(items: Record[]): Record[] {
  return [...items].sort(
    (left, right) =>
      getBaThanhMerchandisingScore(right) -
        getBaThanhMerchandisingScore(left) ||
      left.displayName.localeCompare(right.displayName, "vi"),
  );
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase();
}

export function normalizeBaThanhSearch(value: string) {
  return fold(value).replace(/[^A-Z0-9]+/g, "");
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
