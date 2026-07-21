import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xem trước nội dung",
  robots: { index: false, follow: false, nocache: true },
};

export default function CmsPreviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
