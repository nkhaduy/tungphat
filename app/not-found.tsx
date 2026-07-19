import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "ERROR 404 — Trang này không tồn tại",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <>
      <Header appearance="light" />
      <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#dfe5ef] px-5 pb-16 pt-[132px] sm:px-8 sm:pb-20 sm:pt-[148px]">
        <picture className="absolute -inset-2 -z-20">
          <source media="(max-width: 767px)" srcSet="/images/404-mobile.webp" />
          <img
            src="/images/404-desktop.webp"
            alt=""
            className="h-full w-full scale-[1.015] object-cover object-center blur-[2px] sm:blur-[3px]"
          />
        </picture>

        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,.58)_0%,rgba(239,243,247,.48)_50%,rgba(226,233,240,.64)_100%)]"
          aria-hidden="true"
        />

        <section className="mx-auto flex w-full max-w-[760px] -translate-y-2 flex-col items-center text-center sm:-translate-y-5">
          <h1 className="text-balance text-[clamp(3.25rem,10vw,6rem)] font-extrabold leading-[.92] tracking-[-.035em] text-forest-950 drop-shadow-[0_1px_0_rgba(255,255,255,.65)]">
            ERROR <span className="text-wood-600">404</span>
          </h1>
          <p className="mt-6 text-balance text-[clamp(1.35rem,4vw,2rem)] font-bold leading-tight text-forest-950">
            Trang này không tồn tại...
          </p>

          <div className="mt-8 flex w-full max-w-[470px] flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-forest-900 px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-forest-800"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Về trang chủ
            </Link>
            <TrackedLink
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="click_zalo"
              eventProperties={{ location: "404" }}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-wood-700"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Liên hệ qua Zalo
            </TrackedLink>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
