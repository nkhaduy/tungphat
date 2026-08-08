import path from "node:path";

export const SOURCE_INDEX_URL = "https://bathanh.com.vn/map-ma-melamine";
export const SOURCE_ROBOTS_URL = "https://bathanh.com.vn/robots.txt";
export const SOURCE_HOST = "bathanh.com.vn";
export const USER_AGENT = "TungPhatCatalogueBot/1.0 (+https://mdftungphat.com)";
export const REQUEST_TIMEOUT_MS = 30_000;
export const MAX_RETRIES = 3;
export const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
export const CONCURRENCY = 3;
export const REQUEST_GAP_MS = 120;
export const CACHE_DIR = path.join(process.cwd(), ".cache", "ba-thanh");
export const IMPORT_DIR = path.join(process.cwd(), "data", "imports", "ba-thanh");
export const CATALOG_PATH = path.join(process.cwd(), "data", "catalogs", "ba-thanh.json");
export const MEDIA_DIR = path.join(process.cwd(), "public", "catalog", "ba-thanh");

export const COLOR_DISCLAIMER =
  "Màu hiển thị có thể thay đổi theo màn hình, ánh sáng và điều kiện chụp. Vui lòng đối chiếu mẫu hoặc catalogue thực tế trước khi đặt hàng.";

export const READY_EDITORIAL: Record<string, { description: string; applications: string[] }> = {
  BT111: {
    description: "BT 111 là mã vân gỗ được Tùng Phát đưa vào nhóm mã tham khảo để khách gửi đúng mã khi cần chọn bề mặt cho tủ, kệ hoặc chi tiết nội thất. Quy cách nền ván và tình trạng hàng cần được xác nhận theo từng đơn.",
    applications: ["Tủ và kệ nội thất", "Cánh tủ và vách trang trí", "Chi tiết cần cắt CNC theo file"],
  },
  BT143: {
    description: "BT 143 thuộc nhóm vân gỗ Ba Thanh đang được lưu trong catalogue tham khảo của Tùng Phát. Khách có thể gửi mã cùng kích thước cắt, loại cốt ván và yêu cầu dán cạnh để nhận tư vấn sát với hạng mục.",
    applications: ["Tủ áo và tủ lưu trữ", "Vách ngăn nội thất", "Mặt chi tiết gia công theo quy cách"],
  },
  BT184: {
    description: "BT 184 là một mã Ba Thanh xuất hiện trong bộ sưu tập vân gỗ. Tùng Phát dùng mã này làm mốc tra cứu; màu và vân cần được kiểm tra bằng mẫu thực tế trước khi chốt sản xuất.",
    applications: ["Nội thất nhà ở", "Quầy và kệ trưng bày", "Chi tiết cần dán cạnh đồng màu"],
  },
  SC028M: {
    description: "SC 028M thuộc nhóm đơn sắc Ba Thanh, phù hợp để tham khảo khi khách đã có mã bề mặt và cần ghép với cốt MDF, MFC hoặc quy cách gia công cụ thể. Tùng Phát sẽ kiểm tra lại mã và bề mặt trước khi báo giá.",
    applications: ["Cánh tủ đơn sắc", "Tủ bếp và hệ kệ", "Bề mặt phối cùng vân gỗ"],
  },
  SC029M: {
    description: "SC 029M là mã đơn sắc Ba Thanh được giữ trong danh mục tra cứu. Nội dung trên trang giúp gửi đúng mã; lựa chọn cốt ván, kích thước tấm và dán cạnh vẫn cần xác nhận theo từng yêu cầu.",
    applications: ["Tủ và hộc kéo", "Bàn làm việc và kệ", "Hạng mục cắt ván theo kích thước"],
  },
  BTS14G: {
    description: "BTS 14G thuộc nhóm bề mặt vân đá trong dữ liệu mã Melamine Ba Thanh. Khi dùng cho quầy, vách hoặc mặt trang trí, khách nên gửi cả hướng vân và kích thước chi tiết để Tùng Phát tư vấn cách cắt.",
    applications: ["Quầy và mặt bàn", "Vách trang trí", "Chi tiết CNC cần định hướng vân"],
  },
};
