import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <>
      <div className="fixed inset-x-0 top-0 h-[76px] bg-forest-950" aria-hidden="true" />
      <Header />
      <main className="grid min-h-[72vh] place-items-center bg-[#f6f7f5] px-4 pb-20 pt-32 text-center">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold uppercase tracking-[.18em] text-wood-700">Lỗi 404</p>
          <h1 className="mt-5 text-balance text-4xl font-extrabold text-forest-950 sm:text-5xl">
            Không tìm thấy trang bạn cần
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-600">
            Liên kết có thể đã thay đổi hoặc nội dung đang được cập nhật. Bạn có thể quay về trang chủ, xem danh mục vật liệu hoặc liên hệ Tùng Phát.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-6 text-sm font-bold text-white">
              <ArrowLeft size={17} /> Về trang chủ
            </Link>
            <TrackedLink
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="click_zalo"
              eventProperties={{ location: "404" }}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-wood-700 px-6 text-sm font-bold text-white"
            >
              <MessageCircle size={17} /> Liên hệ qua Zalo
            </TrackedLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
