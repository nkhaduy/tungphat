import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xem trước nội dung · Tùng Phát",
  robots: { index: false, follow: false, noarchive: true },
};

export default function CmsPreviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
