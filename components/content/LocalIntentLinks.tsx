import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { branchPathForLocationId } from "@/lib/branch-pages";
import { locations } from "@/lib/locations";

const relatedLinks = [
  ["go-ghep", "Gỗ ghép tại Thủ Đức"],
  ["go-ghep-cao-su", "Gỗ ghép cao su tại Thủ Đức"],
  ["go-ghep-tram", "Gỗ ghép tràm tại Thủ Đức"],
  ["van-mdf", "Ván MDF tại Thủ Đức"],
  ["mdf-chong-am", "MDF chống ẩm tại Thủ Đức"],
  ["van-go-cong-nghiep", "Ván gỗ công nghiệp tại Thủ Đức"],
  ["gia-cong-cnc", "Gia công CNC tại Thủ Đức"],
  ["cat-cnc-go", "Cắt CNC gỗ tại Thủ Đức"],
] as const;

export function LocalIntentLinks({ currentSlug }: { currentSlug?: string }) {
  const links = relatedLinks.filter(([slug]) => slug !== currentSlug).slice(0, 4);

  return (
    <section className="section-space border-y border-forest-900/10 bg-[#edf4ef]">
      <div className="container-shell grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <div>
          <p className="eyebrow">Tại Thủ Đức</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-.03em] text-forest-950 sm:text-4xl">Trao đổi vật liệu và CNC tại Tam Bình</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-700 sm:text-base">Tùng Phát có hai chi nhánh trên đường Tam Bình, phường Hiệp Bình. Gọi hoặc nhắn Zalo để kiểm tra quy cách, tình trạng hàng và yêu cầu gia công trước khi đến.</p>
          <Link href="/lien-he" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-950 hover:text-wood-600">Xem thông tin liên hệ <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map(([slug, label]) => (
            <Link key={slug} href={`/${slug}`} className="group flex min-h-14 items-center justify-between gap-3 border border-forest-900/10 bg-white px-5 text-sm font-extrabold text-forest-950 shadow-sm hover:border-wood-500/50 hover:text-wood-600">
              {label}<ArrowRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
          {locations.map((location) => (
            <Link key={location.id} href={branchPathForLocationId(location.id)} className="group flex min-h-14 items-center justify-between gap-3 border border-forest-900/10 bg-white px-5 text-sm font-extrabold text-forest-950 shadow-sm hover:border-wood-500/50 hover:text-wood-600">
              {location.address}<ArrowRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
