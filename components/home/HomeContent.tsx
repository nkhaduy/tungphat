import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Box,
  Check,
  CircleDotDashed,
  ExternalLink,
  FileCheck2,
  Layers3,
  MapPin,
  MessageCircle,
  PenTool,
  Phone,
  ScanLine,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { branchPathForLocationId } from "@/lib/branch-pages";
import { getArticles, getProducts } from "@/lib/content";
import { getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import { locations } from "@/lib/locations";
import { resolveMediaUrl } from "@/lib/media";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL } from "@/lib/seo";
import { homeGallery } from "@/lib/workshop-images";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

function SectionIntro({ eyebrow, title, description, centered = false }: SectionIntroProps) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`eyebrow ${centered ? "justify-center" : ""}`}>{eyebrow}</p>
      <h2 className="text-balance mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl">{title}</h2>
      {description ? <p className="text-pretty mt-4 text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
    </div>
  );
}

const materials = [
  { name: "Ván MDF", href: "/van-mdf", image: "/wood/mdfmfc.webp", alt: "Các tấm ván MDF dùng để tham khảo nhóm vật liệu" },
  { name: "MDF chống ẩm", href: "/mdf-chong-am", image: "/wood/vanchongam.webp", alt: "Tấm MDF chống ẩm lõi xanh dùng để tham khảo vật liệu" },
  { name: "Ván MFC", href: "/van-go-cong-nghiep", image: "/wood/melamine.webp", alt: "Bề mặt phủ melamine dùng trên nhóm ván MFC" },
  { name: "Plywood", href: "/van-go-cong-nghiep", image: "/wood/plywood.webp", alt: "Các lớp vật liệu của tấm plywood" },
  { name: "Gỗ ghép", href: "/go-ghep", image: "/images/wood-panels.webp", alt: "Các tấm gỗ ghép dùng để tham khảo nhóm vật liệu" },
  { name: "Gỗ ghép cao su", href: "/go-ghep-cao-su", image: "/images/wood-panels.webp", alt: "Các tấm gỗ ghép dùng để tham khảo vật liệu" },
  { name: "Gỗ ghép tràm", href: "/go-ghep-tram", image: "/wood/veneer.webp", alt: "Bề mặt vân gỗ dùng để tham khảo nhóm gỗ ghép tràm" },
  { name: "Melamine", href: "/catalogue", image: "/wood/melamine.webp", alt: "Mẫu bề mặt melamine vân gỗ" },
  { name: "Laminate, Acrylic & Veneer", href: "/catalogue", image: "/wood/laminate.webp", alt: "Mẫu bề mặt laminate dùng để tham khảo catalogue" }
] as const;

const cncCapabilities: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Cắt theo kích thước", description: "Gửi danh sách chi tiết, vật liệu và độ dày để xưởng đọc đúng yêu cầu.", icon: ScanLine },
  { title: "Khoan liên kết", description: "Ghi vị trí, đường kính và mặt gia công trên bản vẽ hoặc file.", icon: CircleDotDashed },
  { title: "Soi rãnh", description: "Làm rõ chiều rộng, chiều sâu và hướng rãnh trước khi chạy máy.", icon: Layers3 },
  { title: "Cắt biên dạng", description: "Gia công chi tiết theo đường cắt trong file hoặc bản phác thảo đã duyệt.", icon: PenTool },
  { title: "Cắt hoa văn", description: "Gửi file thể hiện rõ đường trùng, điểm hở và tỷ lệ cần cắt.", icon: Box }
];

const brands = [
  { name: "An Cường", slug: "an-cuong", logo: "/partners/an-cuong-logo.webp" },
  { name: "Thanh Thùy", slug: "thanh-thuy", logo: "/partners/thanh-thuy-logo.webp" },
  { name: "Ba Thanh", slug: "ba-thanh", logo: "/partners/ba-thanh-logo.webp" }
] as const;

const supplierLabels = {
  "an-cuong": "An Cường",
  "thanh-thuy": "Thanh Thuỳ",
  "ba-thanh": "Ba Thanh"
} as const;

export async function HomeContent() {
  const [products, articles] = await Promise.all([getProducts(), getArticles()]);
  const publishedProductSlugs = new Set(products.map((product) => product.slug));
  const commonSpecProducts = ["van-mdf", "mdf-chong-am", "go-ghep-cao-su", "go-ghep-tram"]
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
  const featuredColorCodes = getPublicColorCodes()
    .filter((record) => record.seoStatus === "READY_TO_INDEX")
    .sort((left, right) => right.demandScore - left.demandScore || left.codeRaw.localeCompare(right.codeRaw, "vi"))
    .filter((record, index, records) => records.findIndex((candidate) => candidate.supplier === record.supplier && candidate.codeRaw === record.codeRaw) === index)
    .slice(0, 9);
  const latestArticles = articles.slice(0, 3);

  return (
    <>
      <section id="vat-lieu" className="scroll-mt-24 bg-[#f7f9f6] py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionIntro eyebrow="Vật liệu" title="Chọn nhóm ván trước, rồi chọn mã" description="Bắt đầu từ cốt ván và hạng mục sử dụng. Khi đã có mã, độ dày hoặc bề mặt cần tìm, gửi qua Zalo để hỏi hàng và báo giá." />
            <Link href="/san-pham" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">Xem toàn bộ vật liệu <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {materials.map((material) => {
              const isPublishedRoute = material.href.startsWith("/catalogue") || publishedProductSlugs.has(material.href.slice(1));
              if (!isPublishedRoute) return null;
              return (
                <article key={material.name} className="group flex flex-col overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_8px_26px_rgba(7,59,40,.055)] transition duration-200 hover:-translate-y-1 hover:border-wood-500/50 hover:shadow-[0_16px_38px_rgba(7,59,40,.1)]">
                  <Link href={material.href} aria-label={`Xem quy cách ${material.name}`} className="relative block aspect-[4/3] overflow-hidden bg-[#ecefe9]">
                    <Image src={material.image} alt={material.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-300 group-hover:scale-[1.025]" />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-extrabold leading-6 text-forest-950"><Link href={material.href}>{material.name}</Link></h3>
                    <div className="mt-5 grid gap-2">
                      <Link href={material.href} className="inline-flex min-h-11 items-center justify-between gap-2 rounded-md border border-forest-900/15 px-3 text-xs font-extrabold text-forest-950 hover:border-forest-900">Xem {material.name} <BookOpenCheck size={16} aria-hidden="true" /></Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-forest-900/10 bg-white py-16 lg:py-20">
        <div className="container-shell">
          <SectionIntro eyebrow="Tùng Phát tại Thủ Đức" title="Chọn vật liệu, gửi quy cách, làm tiếp phần cắt/CNC" description="Khách có thể xem nhóm ván, tra mã bề mặt rồi gửi quy cách hoặc file. Hai chi nhánh đều ở khu Tam Bình, Thủ Đức." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Có điểm đến cụ thể", "Hai chi nhánh trên đường Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh."],
              ["Có nhóm vật liệu rõ ràng", "MDF, MDF chống ẩm, MFC, Plywood, gỗ ghép và các nhóm bề mặt."],
              ["Có thể trao đổi CNC", "Cắt, khoan, soi rãnh và gia công chi tiết theo file hoặc quy cách."],
            ].map(([title, description]) => <article key={title} className="border border-forest-900/10 bg-[#f7f8f5] p-7"><span className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Tùng Phát</span><h3 className="mt-4 text-xl font-extrabold leading-7 text-forest-950">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-700">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro eyebrow="Quy cách" title="Bắt đầu với loại ván và độ dày cần dùng" description="Đây là các nhóm vật liệu khách thường hỏi. Nếu đã có mã hoặc quy cách, gửi kèm số lượng để hỏi hàng hiện tại." />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {commonSpecProducts.map((product) => (
              <article key={product.slug} className="rounded-xl border border-forest-900/10 bg-[#f8faf7] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-forest-900 shadow-sm"><FileCheck2 size={21} aria-hidden="true" /></span>
                <h3 className="mt-5 text-lg font-extrabold text-forest-950">{product.materialType}</h3>
                <dl className="mt-5 space-y-4 text-sm">
                  <div><dt className="font-extrabold text-forest-950">Độ dày</dt><dd className="mt-1 leading-6 text-slate-600">{product.thicknesses.join("; ")}</dd></div>
                  <div><dt className="font-extrabold text-forest-950">Quy cách tấm</dt><dd className="mt-1 leading-6 text-slate-600">{product.dimensions.join("; ")}</dd></div>
                </dl>
                <Link href={`/${product.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem {product.title} <ArrowRight size={16} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="go-ghep-thu-duc" className="scroll-mt-24 border-y border-forest-900/10 bg-[#edf4ef] py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionIntro eyebrow="Gỗ ghép tại Thủ Đức" title="Cao su hay tràm: xem mặt sử dụng trước" description="Hai nhóm gỗ ghép có trang riêng. Khi hỏi hàng, hãy nêu mặt nhìn thấy, kích thước, độ dày, số lượng và phần việc cần cắt/CNC." />
            <Link href="/go-ghep/" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">Xem trang gỗ ghép <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["Gỗ ghép", "/go-ghep/", "/images/wood-panels.webp", "Gỗ ghép tại Thủ Đức", "Tổng quan nhóm gỗ ghép và cách gửi nhu cầu."],
              ["Gỗ ghép cao su", "/go-ghep-cao-su/", "/images/wood-panels.webp", "Gỗ ghép cao su tại Thủ Đức", "Tham khảo mặt bàn, kệ, tủ và yêu cầu CNC."],
              ["Gỗ ghép tràm", "/go-ghep-tram/", "/wood/veneer.webp", "Gỗ ghép tràm tại Thủ Đức", "Xem mặt sử dụng, màu/vân, quy cách và nhu cầu hoàn thiện."],
            ].map(([title, href, image, alt, description]) => <article key={href} className="group overflow-hidden border border-forest-900/10 bg-white shadow-[0_8px_24px_rgba(7,59,40,.045)]"><Link href={href} className="relative block aspect-[16/10] overflow-hidden"><Image src={image} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.025]" /></Link><div className="p-6"><h3 className="text-xl font-extrabold text-forest-950"><Link href={href}>{title}</Link></h3><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p><Link href={href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem {title} <ArrowRight size={16} aria-hidden="true" /></Link></div></article>)}
          </div>
        </div>
      </section>

      {featuredColorCodes.length ? (
        <section className="border-y border-forest-900/10 bg-[#edf4ef] py-16 lg:py-24">
          <div className="container-shell">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <SectionIntro eyebrow="Catalogue vật liệu" title="Mã màu nổi bật" description="Các mã dưới đây là những trang chi tiết đã đủ dữ liệu để tra cứu công khai. Mở từng mã để xem đúng bề mặt trước khi gửi yêu cầu báo giá." />
              <Link href="/catalogue" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">Xem toàn bộ mã màu vật liệu <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredColorCodes.map((record) => (
                <Link key={record.id} href={record.canonicalRoute} className="group flex min-h-32 items-center justify-between gap-5 border border-forest-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(7,59,40,.045)] transition hover:-translate-y-0.5 hover:border-wood-500/50 hover:shadow-[0_14px_32px_rgba(7,59,40,.08)]">
                  <span>
                    <span className="block text-xs font-extrabold uppercase tracking-[.14em] text-wood-600">{supplierLabels[record.supplier]}</span>
                    <strong className="mt-2 block text-lg text-forest-950">{record.displayName || record.codeRaw}</strong>
                    <span className="mt-2 block text-xs font-bold text-slate-600">Mã {record.codeRaw} · {record.materialType === "melamine" ? "Melamine" : "Laminate"}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-forest-900 transition group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-sm font-extrabold text-forest-950">
              <Link href="/catalogue/an-cuong/melamine/" className="inline-flex min-h-11 items-center hover:text-wood-600">Xem mã màu Melamine An Cường</Link>
              <Link href="/catalogue/thanh-thuy/" className="inline-flex min-h-11 items-center hover:text-wood-600">Xem catalogue Thanh Thuỳ</Link>
              <Link href="/catalogue/ba-thanh/melamine/" className="inline-flex min-h-11 items-center hover:text-wood-600">Xem mã màu Ba Thanh</Link>
            </div>
          </div>
        </section>
      ) : null}

      <section id="nang-luc-cnc" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro eyebrow="Gia công tại Thủ Đức" title="Cắt và gia công CNC theo quy cách" description="Cắt theo kích thước, khoan, soi rãnh và cắt biên dạng. Gửi file hoặc bản phác thảo cùng vật liệu, độ dày và số lượng." centered />
          <div className="mt-12 grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
            <div className="relative min-h-[380px] overflow-hidden rounded-2xl lg:min-h-[570px]">
              <Image src="/images/cnc-service.webp" alt="Đầu máy CNC đang cắt biên dạng trên tấm ván" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Từ file đến đường cắt</p>
                <p className="mt-3 max-w-md text-lg font-extrabold leading-7">Vật liệu, độ dày, đơn vị đo và đường gia công cần được chốt trước khi sản xuất.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cncCapabilities.map(({ title, description, icon: Icon }, index) => (
                <article key={title} className={`rounded-xl border border-forest-900/10 bg-[#fbfcfa] p-6 ${index === cncCapabilities.length - 1 ? "sm:col-span-2" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#edf4ef] text-forest-900"><Icon size={22} aria-hidden="true" /></span>
                    <span className="text-xs font-extrabold text-wood-600">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold text-forest-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#edf4ef] py-16 lg:py-20">
        <div className="container-shell grid overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-[0_20px_60px_rgba(7,59,40,.09)] lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-6 sm:p-9 lg:p-12">
            <SectionIntro eyebrow="Báo giá" title="Gửi loại ván, quy cách hoặc file cần cắt" description="Gửi loại ván, độ dày, số lượng hoặc kích thước cần cắt để nhận báo giá đúng nhu cầu." />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/bao-gia" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-wood-600 px-6 text-sm font-extrabold text-white transition hover:bg-wood-700">Xem báo giá ván MDF <ArrowRight size={17} aria-hidden="true" /></Link>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "home_file_quote", channel: "zalo" }} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-forest-900/20 px-6 text-sm font-extrabold text-forest-950 hover:border-forest-900">
                <Send size={17} aria-hidden="true" /> Gửi quy cách qua Zalo
              </TrackedLink>
            </div>
          </div>
          <div className="border-t border-forest-900/10 bg-[#f8faf7] p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-12">
            <h3 className="text-xl font-extrabold text-forest-950">Thông tin nên gửi kèm</h3>
            <ul className="mt-6 space-y-4">
              {[
                "Loại vật liệu, độ dày và bề mặt nếu đã xác định.",
                "Kích thước, số lượng tấm hoặc danh sách chi tiết.",
                "Đơn vị đo, đường cắt và bản PDF/ảnh nếu có.",
                "Yêu cầu khoan, soi rãnh, mặt gia công và xử lý cạnh nếu có."
              ].map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700"><Check size={18} className="mt-0.5 shrink-0 text-forest-800" aria-hidden="true" />{item}</li>)}
            </ul>
            <p className="mt-7 border-l-2 border-wood-500 pl-4 text-xs leading-5 text-slate-600">Mã, quy cách và tồn kho có thể thay đổi theo từng dòng hàng. Gửi thông tin đang có để hỏi nhanh hơn.</p>
          </div>
        </div>
      </section>

      <section id="thu-vien-xuong" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro eyebrow="Hình ảnh và địa điểm" title="Máy CNC tham khảo và hai chi nhánh Tùng Phát" description="Ảnh máy CNC mang tính tham khảo; ảnh mặt tiền tại đường Tam Bình giúp khách hàng nhận diện đúng địa điểm trước khi đến trao đổi đơn hàng." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {homeGallery.map((item, index) => (
              <figure key={item.src} className={`group overflow-hidden rounded-xl border border-forest-900/10 bg-[#f7f9f6] ${index === 0 ? "md:col-span-2" : ""}`}>
                <div className={`relative overflow-hidden ${index === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}>
                  <Image src={item.src} alt={item.alt} fill sizes={index === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                </div>
                <figcaption className="px-5 py-4 text-sm font-extrabold text-forest-950">{item.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-forest-900/10 bg-[#f7f9f6] py-14 lg:py-18">
        <div className="container-shell">
          <SectionIntro eyebrow="Catalogue theo thương hiệu" title="Tra cứu mã vật liệu theo nhà cung cấp" description="Mở catalogue An Cường, Thanh Thuỳ hoặc Ba Thanh để tìm mã màu và bề mặt trước khi gửi nhu cầu." centered />
          <ul className="mx-auto mt-9 grid max-w-5xl gap-4 sm:grid-cols-3">
            {brands.map((brand) => (
              <li key={brand.slug}>
                <Link href={`/catalogue/${brand.slug}`} className="group flex min-h-[150px] items-center justify-center rounded-xl border border-forest-900/10 bg-white p-7 shadow-[0_8px_24px_rgba(7,59,40,.045)] transition hover:-translate-y-1 hover:border-wood-500/40">
                  <span className="relative block h-[72px] w-full max-w-[220px]">
                    <Image src={brand.logo} alt={`Logo ${brand.name}`} fill sizes="220px" className="object-contain" />
                  </span>
                  <span className="sr-only">Xem catalogue {brand.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro eyebrow="Địa điểm Tùng Phát" title="Hai chi nhánh tại Tam Bình, Thủ Đức" description="Gọi trước để trao đổi vật liệu hoặc gia công, sau đó mở Google Maps để đến đúng chi nhánh Tùng Phát tại TP. Hồ Chí Minh." centered />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {locations.map((branch) => (
              <article key={branch.id} id={branch.id} className="grid overflow-hidden rounded-2xl border border-forest-900/10 bg-[#f8faf7] shadow-[0_12px_36px_rgba(7,59,40,.07)] sm:grid-cols-[.9fr_1.1fr]">
                <div className="relative min-h-[280px] sm:min-h-[340px]">
                  <Image src={branch.image} alt={branch.imageAlt} fill sizes="(max-width: 640px) 100vw, 45vw" className="object-cover" />
                </div>
                <div className="flex flex-col p-6 sm:p-7">
                  <span className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">{branch.shortId}</span>
                  <h3 className="mt-3 text-xl font-extrabold text-forest-950">{branch.name}</h3>
                  <p className="mt-4 flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700"><MapPin size={18} className="mt-0.5 shrink-0 text-forest-800" aria-hidden="true" />{branch.address}</p>
                  <a href={PHONE_HREF} className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-extrabold text-forest-950 hover:text-wood-600"><Phone size={17} className="text-wood-600" aria-hidden="true" />{PHONE_DISPLAY}</a>
                  <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                    <Link href={branchPathForLocationId(branch.id)} className="inline-flex min-h-12 items-center justify-center border border-forest-900/20 px-4 text-center text-sm font-extrabold text-forest-950 hover:border-forest-900">Xem {branch.address.split(",")[0]}</Link>
                    <a href={branch.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-forest-900 px-5 text-sm font-extrabold text-white transition hover:bg-forest-800">Xem chỉ đường <ExternalLink size={16} aria-hidden="true" /></a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {latestArticles.length ? (
        <section className="border-t border-forest-900/10 bg-[#f7f9f6] py-16 lg:py-24">
          <div className="container-shell">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <SectionIntro eyebrow="Kiến thức vật liệu & CNC" title="Bài viết hữu ích từ Tùng Phát" description="Tìm hiểu cách chọn vật liệu và chuẩn bị yêu cầu gia công trước khi liên hệ báo giá." />
              <Link href="/bai-viet" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">Xem kiến thức vật liệu gỗ <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {latestArticles.map((article) => (
                <article key={article.slug} className="group overflow-hidden border border-forest-900/10 bg-white shadow-[0_8px_24px_rgba(7,59,40,.045)]">
                  <Link href={`/bai-viet/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[#ecefe9]">
                    <Image src={resolveMediaUrl(article.featuredImage)} alt={article.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.025]" />
                  </Link>
                  <div className="p-6">
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-600">{article.category}</p>
                    <h3 className="mt-3 text-xl font-extrabold leading-7 text-forest-950"><Link href={`/bai-viet/${article.slug}`}>{article.title}</Link></h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                    <Link href={`/bai-viet/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Đọc {article.title} <ArrowRight size={16} aria-hidden="true" /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#edf4ef] py-14 lg:py-18">
        <div className="container-shell flex flex-col items-start justify-between gap-7 rounded-2xl bg-forest-950 p-7 text-white shadow-[0_18px_50px_rgba(7,59,40,.16)] sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.17em] text-orange-300">Trao đổi nhu cầu thực tế</p>
            <h2 className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Bạn đã có quy cách vật liệu hoặc file CNC?</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">Gửi thông tin đang có: vật liệu, độ dày, kích thước, số lượng và file nếu cần CNC.</p>
          </div>
          <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "home_final_cta", channel: "zalo" }} className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-md bg-wood-600 px-6 text-sm font-extrabold text-white transition hover:bg-wood-700"><MessageCircle size={18} aria-hidden="true" />Gửi quy cách nhận báo giá</TrackedLink>
        </div>
      </section>
    </>
  );
}
