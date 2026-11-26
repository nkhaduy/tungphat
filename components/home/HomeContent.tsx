import { CncCarousel } from "@/components/home/CncCarousel";
import Image from "next/image";
import { MaterialCard } from "@/components/products/MaterialCard";
import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, Phone } from "lucide-react";
import { FeaturedColorCodes, type FeaturedCode } from "@/components/home/FeaturedColorCodes";
import { branchPathForLocationId } from "@/lib/branch-pages";
import { buildCatalogueCodeSeo } from "@/lib/catalog/code-seo";
import { getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import { getArticles } from "@/lib/content";
import { locations } from "@/lib/locations";
import { homeProductCards } from "@/lib/product-taxonomy";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/seo";

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
          <h2 className="font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Danh mục sản phẩm</h2>
          <div className="mt-8 material-grid grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 [&>*:nth-last-child(2)]:xl:col-start-2 [&>*:last-child]:xl:col-start-3">{homeProductCards.map((card) => <MaterialCard key={card.id} card={card} showDescription={false} />)}</div>
        </div>
      </section>

      <section id="ma-mau" className="scroll-mt-24 border-b border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl"><h2 className="font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Mã màu</h2></div>
            <Link href="/catalogue/?supplier=thanh-thuy" prefetch={false} className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-950 hover:text-wood-600">Mở catalogue <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="mt-10"><FeaturedColorCodes thanhThuy={featuredCodes("thanh-thuy", 8)} baThanh={featuredCodes("ba-thanh", 8)} /></div>
        </div>
      </section>

      <section id="nang-luc-cnc" className="scroll-mt-24 border-b border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-wood-600">CNC Tùng Phát</p><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Lên bản vẽ, cắt CNC và dán chỉ</h2><p className="mt-5 text-base leading-8 text-slate-700">Tùng Phát nhận cắt ván theo kích thước, gia công CNC và dán chỉ cạnh theo bản vẽ hoặc yêu cầu của khách hàng, đáp ứng nhu cầu gia công vật liệu gỗ cho nhiều hạng mục nội thất.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link href="/bao-gia/" className="inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-6 text-sm font-bold text-white hover:bg-forest-800">Gửi yêu cầu báo giá <ArrowRight size={16} aria-hidden="true" /></Link><Link href="/gia-cong-cnc/" className="inline-flex min-h-12 items-center justify-center border border-forest-900/25 px-6 text-sm font-bold text-forest-950 hover:border-forest-900 hover:text-wood-600">Xem dịch vụ Cắt CNC <ArrowRight size={16} aria-hidden="true" /></Link></div></div>
          <CncCarousel />
        </div>
      </section>

      <section id="chi-nhanh" className="scroll-mt-24 border-b border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Địa chỉ</h2>
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
                    <a href={PHONE_HREF} className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-extrabold text-forest-950 hover:text-wood-600"><Phone size={17} className="text-wood-600" aria-hidden="true" />{PHONE_DISPLAY}</a>
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

      {articles.length ? <section className="border-b border-forest-900/10 bg-white py-16 lg:py-20"><div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950">Bài viết nổi bật</h2><Link href="/bai-viet/" className="text-sm font-bold text-forest-950 underline underline-offset-4">Xem tất cả bài viết</Link></div><div className="mt-7 grid gap-5 md:grid-cols-3">{articles.map((article) => <article key={article.slug} className="rounded-xl border border-forest-900/10 bg-white"><Link href={`/bai-viet/${article.slug}/`} className="relative block aspect-[16/10]"><Image src={article.featuredImage} alt={article.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-5"><p className="text-xs text-slate-500">{article.category}</p><h3 className="mt-2 text-lg font-bold leading-7 text-forest-950"><Link href={`/bai-viet/${article.slug}/`}>{article.title}</Link></h3></div></article>)}</div></div></section> : null}

    </>
  );
}
