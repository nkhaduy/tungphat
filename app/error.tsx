"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("page_render_failed", { digest: error.digest });
  }, [error]);

  return (
    <SiteShell>
      <section className="grid min-h-[58vh] place-items-center border-b border-forest-900/10 bg-[#f7f8f5] px-4 pb-16 pt-[calc(4rem+4.5rem)] text-center">
        <div className="max-w-2xl border border-forest-900/10 bg-white p-7 shadow-card sm:p-10">
          <p className="eyebrow">Đã có lỗi</p>
          <h1 className="mt-4 text-balance text-3xl font-extrabold text-forest-950 sm:text-4xl">Trang chưa thể hiển thị</h1>
          <p className="mt-4 leading-7 text-slate-700">Vui lòng thử lại. Nếu lỗi còn tiếp diễn, bạn có thể quay về trang chủ và liên hệ Tùng Phát.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={reset} className="pressable inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600"><RotateCcw size={17} aria-hidden="true" />Thử lại</button>
            <Link href="/" className="pressable inline-flex min-h-12 items-center justify-center border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950 hover:border-forest-900">Về trang chủ</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
