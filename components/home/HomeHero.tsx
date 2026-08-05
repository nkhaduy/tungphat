import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, MapPinned, MessageCircle, Ruler, Settings2 } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";

const benefits = [
  { icon: Boxes, title: "Đa dạng vật liệu", text: "MDF, MFC, plywood, gỗ ghép và bề mặt" },
  { icon: Settings2, title: "Gia công CNC theo yêu cầu", text: "Cắt, khoan, soi rãnh và cắt biên dạng" },
  { icon: Ruler, title: "Tư vấn quy cách", text: "Đối chiếu vật liệu, độ dày và kích thước" },
  { icon: MapPinned, title: "Hai chi nhánh tại TP.HCM", text: "14 Tam Bình và 81B Tam Bình" }
] as const;

export function HomeHero() {
  return (
    <section id="trang-chu" className="relative overflow-hidden bg-[#f8faf7]">
        <div className="home-dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="container-shell relative grid items-center gap-10 py-12 sm:py-16 lg:min-h-[620px] lg:grid-cols-[1.02fr_.98fr] lg:gap-14 lg:py-16 xl:min-h-[650px]">
          <div className="max-w-[680px]">
            <p className="eyebrow">Vật liệu gỗ &amp; gia công tại xưởng</p>
            <h1 className="text-balance mt-5 font-display text-[2.35rem] font-extrabold leading-[1.08] tracking-[-.045em] text-forest-950 sm:text-5xl lg:text-[3.5rem] xl:text-[3.9rem]">
              Ván gỗ công nghiệp <span className="text-wood-600">&amp; gia công CNC</span> tại TP.HCM
            </h1>
            <p className="text-pretty mt-6 max-w-2xl text-base leading-7 text-slate-700 sm:text-[1.0625rem] sm:leading-8">
              Tùng Phát cung cấp MDF, MFC, plywood, gỗ ghép và vật liệu bề mặt; đồng thời nhận cắt, khoan, soi rãnh và gia công CNC theo bản vẽ cho xưởng nội thất, thợ mộc và doanh nghiệp.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                eventName="request_quote"
                eventProperties={{ location: "home_hero", channel: "zalo" }}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-wood-500 px-6 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(237,118,16,.22)] transition hover:-translate-y-0.5 hover:bg-wood-600"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Gửi quy cách nhận báo giá
              </TrackedLink>
              <Link href="/san-pham#catalogue" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-forest-900/25 bg-white px-6 text-sm font-extrabold text-forest-950 transition hover:border-forest-900 hover:bg-forest-950 hover:text-white">
                Xem catalogue <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-forest-900/80">
              <span className="rounded-full border border-forest-900/10 bg-white px-3 py-2">MDF · MFC · Plywood</span>
              <span className="rounded-full border border-forest-900/10 bg-white px-3 py-2">Gỗ ghép</span>
              <span className="rounded-full border border-forest-900/10 bg-white px-3 py-2">CNC theo file</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[650px] lg:max-w-none">
            <div className="absolute -left-4 -top-4 h-28 w-28 rounded-tl-[34px] border-l-2 border-t-2 border-wood-500/70 sm:-left-6 sm:-top-6" aria-hidden="true" />
            <div className="relative aspect-[5/4] overflow-hidden rounded-[18px] border border-forest-900/10 bg-white shadow-[0_28px_80px_rgba(7,59,40,.16)] sm:rounded-[24px]">
              <Image
                src="/images/cnc-service-home.webp"
                alt="Máy CNC tại Tùng Phát đang gia công một tấm ván"
                fill
                sizes="(max-width: 1024px) calc(100vw - 32px), 50vw"
                priority
                fetchPriority="high"
                decoding="sync"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/90 via-forest-950/50 to-transparent px-5 pb-5 pt-16 text-white sm:px-7 sm:pb-7">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Gia công tại xưởng</p>
                <p className="mt-2 max-w-md text-sm font-bold leading-6 sm:text-base">Kiểm tra vật liệu, kích thước và nội dung file trước khi chạy máy.</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-2 rounded-lg border border-forest-900/10 bg-white px-4 py-3 shadow-card sm:-right-5 sm:px-5">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-wood-600">Phục vụ tại TP.HCM</span>
              <span className="mt-1 block text-sm font-extrabold text-forest-950">Hai địa điểm tại Tam Bình</span>
            </div>
          </div>
        </div>
    </section>
  );
}

export function HomeBenefits() {
  return (
    <section aria-label="Lợi ích chính" className="bg-forest-900 text-white">
      <ul className="container-shell grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {benefits.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex min-h-[104px] items-center gap-4 px-1 py-5 sm:px-5 first:sm:pl-0 last:sm:pr-0">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10">
              <Icon size={20} className="text-orange-300" aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-sm font-extrabold">{title}</strong>
              <span className="mt-1 block text-xs leading-5 text-white/70">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
