import type { MaterialTaxonomySlug } from "./material-taxonomy";

type AnCuongCategoryContent = {
  label: string;
  title: string;
  description: string;
  intro: string;
  applications: readonly string[];
  guidance: string;
};

export const anCuongCategoryContent = {
  melamine: {
    label: "Melamine",
    title: "Catalogue Melamine An Cường",
    description:
      "Tra cứu mã Melamine An Cường theo tên và dòng bề mặt, sau đó đối chiếu cốt ván, quy cách và mẫu thực tế cùng Tùng Phát.",
    intro:
      "Melamine là nhóm bề mặt thường được cân nhắc cho hệ tủ, kệ và đồ nội thất dạng tấm. Catalogue giúp khoanh vùng màu và vân; mã bề mặt chưa tự xác định loại cốt ván bên dưới.",
    applications: [
      "Tủ bếp, tủ áo và hệ tủ lưu trữ cần phối màu đồng bộ.",
      "Kệ, bàn và vách nội thất sản xuất từ ván công nghiệp.",
      "Hạng mục cần đối chiếu thêm chỉ cạnh, chiều dày và hướng vân.",
    ],
    guidance:
      "Khi gửi mã Melamine, nên kèm vị trí sử dụng, loại cốt ván dự kiến, chiều dày và số lượng. Tùng Phát sẽ kiểm tra lại quy cách có thể cung cấp thay vì suy đoán chỉ từ tên màu.",
  },
  laminate: {
    label: "Laminate",
    title: "Catalogue Laminate An Cường",
    description:
      "Tra cứu mã Laminate An Cường và chuẩn bị thông tin nền dán, kích thước, cạnh hoàn thiện trước khi yêu cầu Tùng Phát kiểm tra.",
    intro:
      "Laminate là bề mặt rời cần được xem cùng cấu tạo nền dán và phương án hoàn thiện cạnh. Trang này tập trung vào việc tìm đúng mã, tên và dòng bề mặt trước bước xác nhận kỹ thuật.",
    applications: [
      "Mặt bàn, quầy và cánh nội thất cần lựa chọn bề mặt riêng với cốt nền.",
      "Chi tiết cong hoặc tạo hình cần kiểm tra khả năng gia công theo cấu tạo thực tế.",
      "Hạng mục phối nhiều bề mặt cần chốt mẫu, hướng vân và vị trí nối.",
    ],
    guidance:
      "Hãy gửi mã Laminate cùng kích thước chi tiết, loại ván nền, yêu cầu dán cạnh và bản vẽ nếu có. Quy cách trong dữ liệu nguồn chỉ dùng để tra cứu ban đầu và cần được xác nhận lại.",
  },
  acrylic: {
    label: "Acrylic",
    title: "Catalogue Acrylic An Cường",
    description:
      "Tra cứu mã Acrylic An Cường cho cánh và chi tiết nội thất, đồng thời xác nhận nền phủ, cạnh và điều kiện quan sát mẫu với Tùng Phát.",
    intro:
      "Acrylic thường được chọn khi thiết kế cần bề mặt có hiệu ứng phản chiếu hoặc màu sắc rõ. Cảm nhận màu thay đổi theo ánh sáng, nên kết quả tra cứu không thay thế việc duyệt mẫu thực tế.",
    applications: [
      "Cánh tủ và mảng nhấn nội thất cần bề mặt sáng, liền mạch.",
      "Không gian bếp hoặc trưng bày cần phối màu dưới điều kiện ánh sáng cụ thể.",
      "Chi tiết cần xác nhận phương án bo, dán hoặc hoàn thiện cạnh trước sản xuất.",
    ],
    guidance:
      "Khi hỏi mã Acrylic, nên nêu kích thước cánh, loại cốt, kiểu cạnh và môi trường ánh sáng. Tùng Phát sẽ đối chiếu khả năng cung cấp và gia công trên cấu hình thực tế.",
  },
} as const satisfies Partial<Record<MaterialTaxonomySlug, AnCuongCategoryContent>>;

export type AnCuongCuratedCategory = keyof typeof anCuongCategoryContent;

export const anCuongCuratedCategories = Object.keys(
  anCuongCategoryContent,
) as AnCuongCuratedCategory[];

export function isAnCuongCuratedCategory(
  value: string,
): value is AnCuongCuratedCategory {
  return Object.hasOwn(anCuongCategoryContent, value);
}
