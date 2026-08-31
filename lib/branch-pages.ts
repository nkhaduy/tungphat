const branchPageConfigs = [
  {
    slug: "14-tam-binh",
    locationId: "chi-nhanh-1",
    title: "Tùng Phát tại 14 Tam Bình, Thủ Đức",
    seoTitle: "Chi Nhánh 14 Tam Bình, Thủ Đức",
    seoDescription: "Địa chỉ Tùng Phát tại 14 Tam Bình, phường Hiệp Bình, TP.HCM. Xem ảnh chi nhánh, Google Maps và liên hệ vật liệu gỗ hoặc CNC.",
    h1: "Tùng Phát tại 14 Tam Bình, Thủ Đức",
    intro: "Điểm liên hệ Tùng Phát tại 14 Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh. Nếu đã có mã, kích thước hoặc file, gửi trước qua Zalo để trao đổi nhanh hơn.",
    visitGuidance: "Nếu đã có mã màu, kích thước hoặc file, gửi trước qua Zalo rồi mở Google Maps theo địa chỉ 14 Tam Bình.",
    sectionEyebrow: "Chuẩn bị trước khi ghé",
    sectionTitle: "Gửi thông tin trước khi đến 14 Tam Bình",
    sectionDescription: "Bạn có thể hỏi trước qua điện thoại hoặc Zalo, sau đó mở đúng địa chỉ trên Maps khi cần đến trực tiếp.",
    checklist: [
      { title: "Mã hoặc ảnh mẫu", text: "Gửi mã bề mặt hoặc ảnh mẫu nếu bạn đang tìm một màu cụ thể." },
      { title: "Quy cách", text: "Ghi kích thước, độ dày và số lượng của tấm hoặc chi tiết." },
      { title: "Phần gia công", text: "Nêu cắt, dán cạnh, khoan, soi rãnh hoặc CNC nếu có." },
      { title: "Chỉ đường", text: "Dùng nút Google Maps bên cạnh địa chỉ để mở đúng điểm 14 Tam Bình." },
    ],
    relatedLinks: [["Gỗ ghép tại Thủ Đức", "/go-ghep/"], ["Ván MDF tại Thủ Đức", "/van-mdf/"], ["Cắt CNC gỗ tại Thủ Đức", "/cat-cnc-go/"], ["Gia công CNC tại Thủ Đức", "/gia-cong-cnc/"]],
    finalTitle: "Cần hỏi trước khi ghé 14 Tam Bình?",
    finalDescription: "Gửi mã, quy cách, số lượng hoặc file cần gia công. Bạn cũng có thể gọi trực tiếp nếu cần hỏi nhanh.",
  },
  {
    slug: "81b-tam-binh",
    locationId: "chi-nhanh-2",
    title: "Tùng Phát tại 81B Tam Bình, Thủ Đức",
    seoTitle: "Chi Nhánh 81B Tam Bình, Thủ Đức",
    seoDescription: "Địa chỉ Tùng Phát tại 81B Tam Bình, phường Hiệp Bình, TP.HCM. Xem ảnh chi nhánh, Google Maps và liên hệ vật liệu gỗ hoặc CNC.",
    h1: "Tùng Phát tại 81B Tam Bình, Thủ Đức",
    intro: "Điểm liên hệ Tùng Phát tại 81B Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh. Mở Maps theo đúng số nhà và gửi trước quy cách nếu bạn cần hỏi vật liệu hoặc CNC.",
    visitGuidance: "Khi tìm 81B Tam Bình trên bản đồ, mở đúng link Maps bên dưới; mã, ảnh mẫu hoặc file có thể gửi trước qua Zalo.",
    sectionEyebrow: "Gửi yêu cầu từ xa",
    sectionTitle: "Mở đúng điểm 81B Tam Bình và gửi quy cách",
    sectionDescription: "Nếu chưa tiện ghé ngay, hãy gọi hoặc nhắn Zalo kèm thông tin đang có. Khi cần đến, dùng link Maps theo đúng số nhà.",
    checklist: [
      { title: "Địa chỉ", text: "Đối chiếu số 81B Tam Bình trên link Maps trước khi xuất phát." },
      { title: "Bản vẽ hoặc file", text: "Gửi file kỹ thuật cùng vật liệu, độ dày và số lượng nếu cần CNC." },
      { title: "Vật liệu", text: "Nêu MDF, MDF chống ẩm, MFC, Plywood hoặc gỗ ghép bạn đang tìm." },
      { title: "Kênh liên hệ", text: "Gọi hoặc nhắn Zalo để hỏi mã, quy cách và phần việc cần làm." },
    ],
    relatedLinks: [["Gia công CNC tại Thủ Đức", "/gia-cong-cnc/"], ["Cắt CNC gỗ tại Thủ Đức", "/cat-cnc-go/"], ["Ván MDF tại Thủ Đức", "/van-mdf/"], ["Gỗ ghép tại Thủ Đức", "/go-ghep/"]],
    finalTitle: "Cần trao đổi trước khi đến 81B Tam Bình?",
    finalDescription: "Gửi vật liệu, mã bề mặt, kích thước, số lượng hoặc file. Tùng Phát sẽ trao đổi phần thông tin cần thiết qua điện thoại hoặc Zalo.",
  },
] as const;

export const branchPageSlugs = branchPageConfigs.map((branch) => branch.slug);

export function getBranchPageConfig(slug: string) {
  return branchPageConfigs.find((branch) => branch.slug === slug);
}

export function branchPathForLocationId(locationId: string) {
  const branch = branchPageConfigs.find((candidate) => candidate.locationId === locationId);
  if (!branch) throw new Error(`Unknown branch location: ${locationId}`);
  return `/chi-nhanh/${branch.slug}/`;
}
