"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("page_render_failed", { digest: error.digest });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f5] px-4 text-center">
      <div className="max-w-xl">
        <p className="text-sm font-extrabold uppercase tracking-[.18em] text-wood-700">Đã có lỗi</p>
        <h1 className="mt-4 text-3xl font-extrabold text-forest-950 sm:text-4xl">
          Trang chưa thể hiển thị
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Vui lòng thử lại. Nếu lỗi còn tiếp diễn, bạn có thể quay về trang chủ và liên hệ Tùng Phát.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-12 bg-wood-700 px-6 text-sm font-bold text-white"
          >
            Thử lại
          </button>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center border border-forest-900/20 px-6 text-sm font-bold text-forest-950">
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
