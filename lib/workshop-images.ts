import { getLocationImage } from "@/lib/locations";

export const homeGallery = [
  { src: "/images/cnc-service.webp", alt: "Ảnh minh họa máy CNC gia công một tấm ván", label: "Ảnh minh họa máy CNC" },
  { src: getLocationImage("chi-nhanh-1"), alt: "Mặt tiền cửa hàng Tùng Phát tại 14 Tam Bình", label: "Mặt tiền chi nhánh 1" },
  { src: getLocationImage("chi-nhanh-2"), alt: "Mặt tiền chi nhánh Tùng Phát tại 81B Tam Bình", label: "Mặt tiền chi nhánh 2" },
] as const;

export const workshopImages = [
  { src: "/images/cnc-service.webp", alt: "Ảnh minh họa máy CNC gia công một tấm ván", caption: "Ảnh minh họa máy CNC" },
  { src: getLocationImage("chi-nhanh-1"), alt: "Mặt tiền cửa hàng Tùng Phát tại 14 Tam Bình", caption: "Mặt tiền chi nhánh 1" },
  { src: getLocationImage("chi-nhanh-2"), alt: "Mặt tiền chi nhánh Tùng Phát tại 81B Tam Bình", caption: "Mặt tiền chi nhánh 2" },
] as const;
