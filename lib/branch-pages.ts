const branchPageConfigs = [
  {
    slug: "14-tam-binh",
    locationId: "chi-nhanh-1",
    title: "Tùng Phát tại 14 Tam Bình, Thủ Đức",
    seoTitle: "Chi Nhánh 14 Tam Bình, Thủ Đức",
    seoDescription: "Địa chỉ Tùng Phát tại 14 Tam Bình, phường Hiệp Bình, TP.HCM. Xem ảnh chi nhánh, Google Maps và liên hệ vật liệu gỗ hoặc CNC.",
    h1: "Tùng Phát tại 14 Tam Bình, Thủ Đức",
    intro: "Điểm liên hệ Tùng Phát tại 14 Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh. Gọi hoặc nhắn Zalo trước để kiểm tra vật liệu, quy cách và nhu cầu gia công.",
  },
  {
    slug: "81b-tam-binh",
    locationId: "chi-nhanh-2",
    title: "Tùng Phát tại 81B Tam Bình, Thủ Đức",
    seoTitle: "Chi Nhánh 81B Tam Bình, Thủ Đức",
    seoDescription: "Địa chỉ Tùng Phát tại 81B Tam Bình, phường Hiệp Bình, TP.HCM. Xem ảnh chi nhánh, Google Maps và liên hệ vật liệu gỗ hoặc CNC.",
    h1: "Tùng Phát tại 81B Tam Bình, Thủ Đức",
    intro: "Điểm liên hệ Tùng Phát tại 81B Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh. Gọi hoặc nhắn Zalo trước để kiểm tra vật liệu, quy cách và nhu cầu gia công.",
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
