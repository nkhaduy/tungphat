import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, PanelsTopLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "ERROR 404 — Trang này không tồn tại",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <main className="relative isolate grid min-h-[100svh] overflow-hidden bg-[#dfe5ef] px-5 py-6 sm:px-8 sm:py-8">
      <picture className="absolute -inset-5 -z-20">
        <source media="(max-width: 767px)" srcSet="/images/404-mobile.webp" />
        <img
          src="/images/404-desktop.webp"
          alt=""
          className="h-full w-full scale-[1.04] object-cover object-center blur-[7px] sm:blur-[9px]"
        />
      </picture>

      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(245,247,250,.76)_0%,rgba(239,243,247,.68)_48%,rgba(226,233,240,.82)_100%)]"
        aria-hidden="true"
      />

      <Link
        href="/"
        aria-label="Về trang chủ Tùng Phát"
        className="relative z-10 h-[46px] w-[210px] self-start sm:h-[54px] sm:w-[250px]"
      >
        <Image
          src="/logo-horizontal.png"
          alt="Tùng Phát"
          fill
          sizes="(min-width: 640px) 250px, 210px"
          quality={95}
          className="object-contain object-left"
          priority
        />
      </Link>

      <section className="mx-auto flex w-full max-w-[760px] -translate-y-4 flex-col items-center self-center text-center sm:-translate-y-8">
        <h1 className="text-balance text-[clamp(3.25rem,10vw,6rem)] font-extrabold leading-[.92] tracking-[-.035em] text-forest-950 drop-shadow-[0_1px_0_rgba(255,255,255,.65)]">
          ERROR <span className="text-wood-600">404</span>
        </h1>
        <p className="mt-6 text-balance text-[clamp(1.35rem,4vw,2rem)] font-bold leading-tight text-forest-950">
          Trang này không tồn tại...
        </p>
        <p className="mt-4 max-w-[590px] text-pretty text-sm font-medium leading-6 text-[#34463d] sm:text-base sm:leading-7">
          Địa chỉ có thể đã thay đổi hoặc nội dung không còn khả dụng. Hãy quay về trang chủ hoặc tiếp tục xem danh mục vật liệu của Tùng Phát.
        </p>

        <div className="mt-8 flex w-full max-w-[470px] flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-forest-900 px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-forest-800"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Về trang chủ
          </Link>
          <Link
            href="/san-pham"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-forest-900 bg-white/55 px-6 text-sm font-bold text-forest-950 transition-colors duration-200 hover:bg-white/85"
          >
            <PanelsTopLeft size={18} aria-hidden="true" />
            Xem vật liệu
          </Link>
        </div>
      </section>

      <p className="self-end text-center text-xs font-semibold text-forest-950/65 sm:text-left">
        Tùng Phát · Vật liệu gỗ &amp; gia công CNC
      </p>
    </main>
  );
}
