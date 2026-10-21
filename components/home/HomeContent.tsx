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

const suppliers = [
  {
    name: "Thanh Thùy",
    slug: "thanh-thuy",
    logo: "/partners/thanh-thuy-logo.webp",
    title: "Bề mặt trang trí và mã màu",
    description: "Xem Melamine, Laminate, Acrylic, PVC Film, Veneer và chỉ nẹp theo từng dòng. Mã bề mặt cần đi cùng cốt ván và quy cách khi hỏi hàng.",
    groups: ["Melamine", "Laminate", "Acrylic", "PVC Film", "Veneer", "Chỉ nẹp"],
  },
  {
    name: "Ba Thanh",
    slug: "ba-thanh",
    logo: "/partners/ba-thanh-logo.webp",
    title: "Cốt ván, bề mặt và vật tư",
    description: "Tham khảo MDF, HDF, ván chống ẩm, MFC, Plywood, Melamine và Laminate Way. Gửi mã hoặc cấu hình để kiểm tra nguồn hàng.",
    groups: ["MDF / HDF", "MFC", "Plywood", "Melamine", "Laminate Way"],
  },
] as const;

const faqs = [
  ["MDF thường và MDF chống ẩm khác nhau thế nào?", "MDF chống ẩm dùng cho môi trường ẩm hơn phòng khô. Lõi xanh không có nghĩa là tấm ván chống nước hoàn toàn; bề mặt, cạnh và vị trí sử dụng vẫn cần chọn đúng."],
  ["Melamine và Laminate khác nhau ra sao?", "Cả hai là bề mặt trang trí, không phải cốt ván. Laminate là tấm phủ riêng, còn Melamine thường được ép lên cốt ván. Khi chọn cần nói rõ cốt nền, bề mặt và phần cạnh."],
  ["Tùng Phát có nhận cắt ván theo kích thước không?", "Có. Gửi loại ván, độ dày, kích thước từng chi tiết và số lượng. Nếu cần CNC, gửi thêm file hoặc bản vẽ có đơn vị đo."],
  ["Cần cung cấp gì để nhận báo giá?", "Gửi loại cốt ván, mã bề mặt nếu có, độ dày, khổ hoặc kích thước cắt, số lượng, phần gia công và khu vực nhận hàng."],
  ["Tra mã màu Thanh Thùy và Ba Thanh ở đâu?", "Mở catalogue theo thương hiệu, tìm bằng mã hoặc tên màu, rồi gửi link mã đã chọn để Tùng Phát kiểm tra quy cách và hàng."],
] as const;

function MaterialCard({ card }: { card: ProductDiscoveryCard }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white transition-colors hover:border-slate-400">
      <Link href={card.href} className="relative block aspect-[4/3] overflow-hidden bg-slate-50" aria-label={`Xem ${card.title}`}>
        <Image src={card.image} alt={card.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain transition-transform duration-200 group-hover:scale-[1.025]" />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-bold text-slate-950"><Link href={card.href}>{card.title}</Link></h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{card.description}</p>
        <Link href={card.href} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm font-bold text-slate-900">Xem chi tiết <ArrowRight size={15} aria-hidden="true" /></Link>
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
      <section id="vat-lieu" className="scroll-mt-24 border-b border-slate-200 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Danh mục sản phẩm</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950 sm:text-4xl">Khám phá vật liệu tại Tùng Phát</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">Bắt đầu từ cốt ván, sau đó chọn bề mặt và phần hoàn thiện. Mỗi nhóm dẫn đến trang vật liệu hoặc mã màu đang có dữ liệu.</p>
            </div>
            <Link href="/san-pham/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-950 underline underline-offset-4">Xem toàn bộ sản phẩm <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="mt-10">
            <h3 className="mb-4 text-sm font-bold text-slate-700">Cốt ván / vật liệu</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{coreMaterialCards.map((card) => <MaterialCard key={card.id} card={card} />)}</div>
          </div>
          <div className="mt-10 border-t border-slate-200 pt-8">
            <h3 className="mb-4 text-sm font-bold text-slate-700">Bề mặt trang trí</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{surfaceCatalogueCards.map((card) => <MaterialCard key={card.id} card={card} />)}</div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-6 text-sm">
            <span className="font-bold text-slate-950">Vật tư hoàn thiện</span>
            <Link href="/thuong-hieu/thanh-thuy/" className="min-h-10 content-center text-slate-700 underline underline-offset-4">Chỉ nẹp Thanh Thùy</Link>
            <Link href="/thuong-hieu/ba-thanh/" className="min-h-10 content-center text-slate-700 underline underline-offset-4">Chỉ cạnh, keo Ba Thanh</Link>
          </div>
        </div>
      </section>

      <section id="thuong-hieu" className="scroll-mt-24 border-b border-slate-200 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Nhà cung cấp vật liệu</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950 sm:text-4xl">Chọn theo thương hiệu</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {suppliers.map((supplier, index) => (
              <article key={supplier.slug} className="flex min-w-0 flex-col border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative h-14 w-36"><Image src={supplier.logo} alt={`Logo ${supplier.name}`} fill sizes="144px" className="object-contain object-left" /></div>
                  <span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{index === 0 ? "Thương hiệu chủ lực" : "Thương hiệu bổ sung"}</span>
                </div>
                <h3 className="mt-8 text-2xl font-bold text-slate-950">{supplier.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-700">{supplier.title}</p>
                <p className="mt-4 max-w-[55ch] text-sm leading-7 text-slate-600">{supplier.description}</p>
                <p className="mt-5 text-xs leading-6 text-slate-500">{supplier.groups.join(" · ")}</p>
                <Link href={`/thuong-hieu/${supplier.slug}/`} className="mt-auto inline-flex min-h-12 items-center gap-2 self-start border-b-2 border-slate-950 pt-7 text-sm font-bold text-slate-950">Xem sản phẩm {supplier.name} <ArrowRight size={16} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ma-mau" className="scroll-mt-24 border-b border-slate-200 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Catalogue</p><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950 sm:text-4xl">Mã màu nổi bật</h2><p className="mt-4 text-sm leading-7 text-slate-600">Tra mã và xem ảnh bề mặt đã có trong catalogue. Chọn mã trước, sau đó gửi cốt ván và độ dày để hỏi hàng.</p></div>
            <Link href="/catalogue/" prefetch={false} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-950 underline underline-offset-4">Tìm mã khác <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="mt-7"><FeaturedColorCodes thanhThuy={featuredCodes("thanh-thuy", 8)} baThanh={featuredCodes("ba-thanh", 8)} /></div>
        </div>
      </section>

      <section id="nang-luc-cnc" className="scroll-mt-24 border-b border-slate-200 bg-white py-16 lg:py-24">
        <div className="container-shell grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden border border-slate-200"><Image src="/images/cnc-service.webp" alt="Đầu máy CNC đang cắt biên dạng trên tấm ván" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Cắt ván &amp; CNC</p><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950 sm:text-4xl">Gửi kích thước, xưởng kiểm tra cách làm</h2><p className="mt-5 text-base leading-8 text-slate-700">Tùng Phát nhận cắt ván và gia công CNC cho chi tiết dạng tấm. Khi gửi yêu cầu, hãy ghi loại ván, độ dày, kích thước, số lượng và file nếu đã có.</p><Link href="/gia-cong-cnc/" className="mt-7 inline-flex min-h-12 items-center gap-2 bg-slate-950 px-6 text-sm font-bold text-white hover:bg-slate-800">Gửi kích thước / file để nhận báo giá <ArrowRight size={16} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section id="chi-nhanh" className="scroll-mt-24 border-b border-slate-200 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <h2 className="font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950 sm:text-4xl">Xưởng &amp; chi nhánh</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Xem địa chỉ và đường đi trước khi đến. Có thể gửi mã vật liệu, kích thước hoặc file qua Zalo để trao đổi trước.</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {locations.map((branch) => (
              <article key={branch.id} className="overflow-hidden border border-slate-200 bg-white">
                <div className="relative aspect-[16/9]"><Image src={branch.image} alt={branch.imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
                <div className="p-5 sm:p-6"><p className="text-xs font-bold text-slate-500">{branch.shortId}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{branch.name}</h3><p className="mt-3 flex gap-2 text-sm leading-6 text-slate-700"><MapPin size={17} className="mt-1 shrink-0" aria-hidden="true" />{branch.address}</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm font-bold text-slate-950"><Link href={branchPathForLocationId(branch.id)} className="inline-flex min-h-11 items-center underline underline-offset-4">Xem chi nhánh</Link><a href={branch.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 underline underline-offset-4">Mở Maps <ExternalLink size={14} aria-hidden="true" /></a><a href={PHONE_HREF} className="inline-flex min-h-11 items-center gap-1 underline underline-offset-4"><Phone size={14} aria-hidden="true" />{PHONE_DISPLAY}</a></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {articles.length ? <section className="border-b border-slate-200 bg-white py-16 lg:py-20"><div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950">Kiến thức chọn vật liệu</h2><Link href="/bai-viet/" className="text-sm font-bold text-slate-950 underline underline-offset-4">Xem tất cả bài viết</Link></div><div className="mt-7 grid gap-5 md:grid-cols-3">{articles.map((article) => <article key={article.slug} className="border border-slate-200 bg-white"><Link href={`/bai-viet/${article.slug}/`} className="relative block aspect-[16/10]"><Image src={article.featuredImage} alt={article.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-5"><p className="text-xs text-slate-500">{article.category}</p><h3 className="mt-2 text-lg font-bold leading-7 text-slate-950"><Link href={`/bai-viet/${article.slug}/`}>{article.title}</Link></h3></div></article>)}</div></div></section> : null}

      <section className="border-b border-slate-200 bg-white py-16 lg:py-20" aria-labelledby="home-faq-title"><div className="container-shell grid gap-8 lg:grid-cols-[.65fr_1.35fr] lg:gap-16"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">FAQ</p><h2 id="home-faq-title" className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950">Hỏi trước khi chọn ván</h2></div><div>{faqs.map(([question, answer]) => <details key={question} className="group border-t border-slate-200 py-5 last:border-b"><summary className="cursor-pointer pr-6 text-base font-bold leading-7 text-slate-950 marker:text-slate-500">{question}</summary><p className="mt-3 max-w-[70ch] text-sm leading-7 text-slate-700">{answer}</p></details>)}</div></div></section>
    </>
  );
}
