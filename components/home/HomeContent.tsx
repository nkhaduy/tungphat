import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, Phone } from "lucide-react";
import { FeaturedColorCodes, type FeaturedCode } from "@/components/home/FeaturedColorCodes";
import { branchPathForLocationId } from "@/lib/branch-pages";
import { buildCatalogueCodeSeo } from "@/lib/catalog/code-seo";
import { getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import { getArticles } from "@/lib/content";
import { locations } from "@/lib/locations";
import { coreMaterialCards, surfaceCatalogueCards, type ProductDiscoveryCard } from "@/lib/product-taxonomy";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/seo";

const faqs = [
  ["MDF thường và MDF chống ẩm khác nhau thế nào?", "MDF chống ẩm dùng cho môi trường ẩm hơn phòng khô. Lõi xanh không có nghĩa là tấm ván chống nước hoàn toàn; bề mặt, cạnh và vị trí sử dụng vẫn cần chọn đúng."],
  ["Melamine và Laminate khác nhau ra sao?", "Cả hai là bề mặt trang trí, không phải cốt ván. Laminate là tấm phủ riêng, còn Melamine thường được ép lên cốt ván. Khi chọn cần nói rõ cốt nền, bề mặt và phần cạnh."],
  ["Tùng Phát có nhận cắt ván theo kích thước không?", "Có. Gửi loại ván, độ dày, kích thước từng chi tiết và số lượng. Nếu cần CNC, gửi thêm file hoặc bản vẽ có đơn vị đo."],
  ["Cần cung cấp gì để nhận báo giá?", "Gửi loại cốt ván, mã bề mặt nếu có, độ dày, khổ hoặc kích thước cắt, số lượng, phần gia công và khu vực nhận hàng."],
  ["Tra mã màu Thanh Thùy và Ba Thanh ở đâu?", "Mở catalogue theo thương hiệu, tìm bằng mã hoặc tên màu, rồi gửi link mã đã chọn để Tùng Phát kiểm tra quy cách và hàng."],
] as const;

function MaterialCard({ card }: { card: ProductDiscoveryCard }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_8px_24px_rgba(7,59,40,.045)] transition-colors hover:border-wood-500/50">
      <Link href={card.href} className="relative block aspect-[4/3] overflow-hidden bg-[#18281f]" aria-label={`Xem ${card.title}`}>
        <Image src={card.image} alt={card.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain transition-transform duration-200 group-hover:scale-[1.025]" />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-extrabold text-forest-950"><Link href={card.href}>{card.title}</Link></h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{card.description}</p>
        <Link href={card.href} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm font-extrabold text-wood-600">Xem chi tiết <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

function featuredCodes(supplier: "thanh-thuy" | "ba-thanh", limit: number): FeaturedCode[] {
  const supplierName = supplier === "thanh-thuy" ? "Thanh Thùy" : "Ba Thanh";
  const qualified = getPublicColorCodes()
    .filter((record) => record.supplier === supplier && record.images.some((image) => image.localPath) && buildCatalogueCodeSeo(record, { supplierName }).indexable)
    .sort((left, right) => right.demandScore - left.demandScore || left.codeRaw.localeCompare(right.codeRaw, "vi"));
  const mix: readonly [string, number][] = supplier === "thanh-thuy"
    ? [["melamine", 4], ["laminate", 2], ["acrylic", 2]]
    : [["melamine", 3], ["laminate", 5]];
  const selected = mix.flatMap(([material, count]) => qualified.filter((record) => record.materialType === material).slice(0, count));
  const ids = new Set(selected.map((record) => record.id));
  selected.push(...qualified.filter((record) => !ids.has(record.id)).slice(0, Math.max(0, limit - selected.length)));
  return selected.slice(0, limit)
    .map((record) => ({
      id: record.id,
      code: record.codeRaw,
      name: record.displayName || record.codeRaw,
      material: record.materialType === "acrylic" ? "Acrylic" : record.materialType === "laminate" ? "Laminate" : "Melamine",
      image: record.images.find((image) => image.localPath)?.localPath || "",
      href: record.canonicalRoute,
    }));
}

export async function HomeContent() {
  const articles = (await getArticles()).slice(0, 3);
  return (
    <>
      <section id="vat-lieu" className="scroll-mt-24 border-b border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Danh mục sản phẩm</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Khám phá vật liệu tại Tùng Phát</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">Bắt đầu từ cốt ván, sau đó chọn bề mặt và phần hoàn thiện. Mỗi nhóm dẫn đến trang vật liệu hoặc mã màu đang có dữ liệu.</p>
            </div>
            <Link href="/san-pham/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-950 underline underline-offset-4">Xem toàn bộ sản phẩm <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="mt-10">
            <h3 className="mb-4 text-sm font-bold text-slate-700">Cốt ván / vật liệu</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{coreMaterialCards.map((card) => <MaterialCard key={card.id} card={card} />)}</div>
          </div>
          <div className="mt-10 border-t border-forest-900/10 pt-8">
            <h3 className="mb-4 text-sm font-bold text-slate-700">Bề mặt trang trí</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{surfaceCatalogueCards.map((card) => <MaterialCard key={card.id} card={card} />)}</div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-forest-900/10 pt-6 text-sm">
            <span className="font-bold text-forest-950">Vật tư hoàn thiện</span>
            <Link href="/thuong-hieu/thanh-thuy/" className="min-h-10 content-center text-slate-700 underline underline-offset-4">Chỉ nẹp Thanh Thùy</Link>
            <Link href="/thuong-hieu/ba-thanh/" className="min-h-10 content-center text-slate-700 underline underline-offset-4">Chỉ cạnh, keo Ba Thanh</Link>
          </div>
        </div>
      </section>

      <section id="ma-mau" className="scroll-mt-24 border-b border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl"><h2 className="font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Mã màu</h2><p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Tra cứu theo thương hiệu và mã màu. Mã bề mặt không tự xác định cốt ván; hãy gửi cả nhu cầu sử dụng khi hỏi hàng.</p></div>
            <Link href="/catalogue/" prefetch={false} className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-950 hover:text-wood-600">Mở catalogue <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="mt-10"><FeaturedColorCodes thanhThuy={featuredCodes("thanh-thuy", 8)} baThanh={featuredCodes("ba-thanh", 8)} /></div>
        </div>
      </section>

      <section id="nang-luc-cnc" className="scroll-mt-24 border-b border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src="/images/cnc-service.webp" alt="Đầu máy CNC đang cắt biên dạng trên tấm ván" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Cắt ván &amp; CNC</p><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Gửi kích thước, xưởng kiểm tra cách làm</h2><p className="mt-5 text-base leading-8 text-slate-700">Tùng Phát nhận cắt ván và gia công CNC cho chi tiết dạng tấm. Khi gửi yêu cầu, hãy ghi loại ván, độ dày, kích thước, số lượng và file nếu đã có.</p><Link href="/gia-cong-cnc/" className="mt-7 inline-flex min-h-12 items-center gap-2 bg-forest-900 px-6 text-sm font-bold text-white hover:bg-forest-800">Gửi kích thước / file để nhận báo giá <ArrowRight size={16} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section id="chi-nhanh" className="scroll-mt-24 border-b border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Địa chỉ</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Xem tên cửa hàng, địa chỉ và bản đồ của từng chi nhánh trước khi đến.</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {locations.map((branch) => (
              <div key={branch.id} className="overflow-hidden rounded-2xl border border-forest-900/10 bg-[#f8faf7] shadow-[0_12px_36px_rgba(7,59,40,.07)]">
                <article className="grid sm:grid-cols-[.82fr_1.18fr]">
                  <div className="relative min-h-[250px] sm:min-h-[300px]"><Image src={branch.image} alt={branch.imageAlt} fill sizes="(max-width: 640px) 100vw, 42vw" className="object-cover" /></div>
                  <div className="flex flex-col p-6 sm:p-7">
                    <span className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">{branch.shortId}</span>
                    <h3 className="mt-3 text-xl font-extrabold text-forest-950">{branch.name}</h3>
                    <p className="mt-4 flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700"><MapPin size={18} className="mt-0.5 shrink-0 text-forest-800" aria-hidden="true" />{branch.address}</p>
                    <a href={PHONE_HREF} className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-extrabold text-forest-950 hover:text-wood-600"><Phone size={17} className="text-wood-600" aria-hidden="true" />Gọi {PHONE_DISPLAY}</a>
                    <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                      <Link href={branchPathForLocationId(branch.id)} className="inline-flex min-h-12 items-center justify-center border border-forest-900/20 px-4 text-center text-sm font-extrabold text-forest-950 hover:border-forest-900">Xem chi nhánh</Link>
                      <a href={branch.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-forest-900 px-5 text-sm font-extrabold text-white transition hover:bg-forest-800">Mở Maps <ExternalLink size={16} aria-hidden="true" /></a>
                    </div>
                  </div>
                </article>
                <iframe title={`Google Maps - ${branch.name}`} src={branch.embedSrc} loading="lazy" className="h-52 w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {articles.length ? <section className="border-b border-forest-900/10 bg-white py-16 lg:py-20"><div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950">Kiến thức chọn vật liệu</h2><Link href="/bai-viet/" className="text-sm font-bold text-forest-950 underline underline-offset-4">Xem tất cả bài viết</Link></div><div className="mt-7 grid gap-5 md:grid-cols-3">{articles.map((article) => <article key={article.slug} className="rounded-xl border border-forest-900/10 bg-white"><Link href={`/bai-viet/${article.slug}/`} className="relative block aspect-[16/10]"><Image src={article.featuredImage} alt={article.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-5"><p className="text-xs text-slate-500">{article.category}</p><h3 className="mt-2 text-lg font-bold leading-7 text-forest-950"><Link href={`/bai-viet/${article.slug}/`}>{article.title}</Link></h3></div></article>)}</div></div></section> : null}

      <section className="border-b border-forest-900/10 bg-white py-16 lg:py-20" aria-labelledby="home-faq-title"><div className="container-shell grid gap-8 lg:grid-cols-[.65fr_1.35fr] lg:gap-16"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">FAQ</p><h2 id="home-faq-title" className="mt-3 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950">Hỏi trước khi chọn ván</h2></div><div>{faqs.map(([question, answer]) => <details key={question} className="group border-t border-forest-900/10 py-5 last:border-b"><summary className="cursor-pointer pr-6 text-base font-bold leading-7 text-forest-950 marker:text-slate-500">{question}</summary><p className="mt-3 max-w-[70ch] text-sm leading-7 text-slate-700">{answer}</p></details>)}</div></div></section>
    </>
  );
}
