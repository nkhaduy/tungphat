import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CircleDotDashed,
  ExternalLink,
  Layers3,
  MapPin,
  MessageCircle,
  PenTool,
  Phone,
  ScanLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { branchPathForLocationId } from "@/lib/branch-pages";
import { getArticles } from "@/lib/content";
import { buildCatalogueCodeSeo } from "@/lib/catalog/code-seo";
import { getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import { locations } from "@/lib/locations";
import { coreMaterialCards, surfaceCatalogueCards } from "@/lib/product-taxonomy";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL } from "@/lib/seo";

type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
};

function SectionIntro({ eyebrow, title, description, centered = false }: SectionIntroProps) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className={`eyebrow ${centered ? "justify-center" : ""}`}>{eyebrow}</p> : null}
      <h2 className={`text-balance ${eyebrow ? "mt-4" : "mt-0"} font-display text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl`}>{title}</h2>
      {description ? <p className="text-pretty mt-4 text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
    </div>
  );
}

const supplierCards = [
  { name: "An Cường", slug: "an-cuong", logo: "/partners/an-cuong-logo.webp" },
  { name: "Thanh Thuỳ", slug: "thanh-thuy", logo: "/partners/thanh-thuy-logo.webp" },
  { name: "Ba Thanh", slug: "ba-thanh", logo: "/partners/ba-thanh-logo.webp" },
] as const;

const supplierLabels = {
  "an-cuong": "An Cường",
  "thanh-thuy": "Thanh Thuỳ",
  "ba-thanh": "Ba Thanh",
} as const;

const cncCapabilities: { title: string; icon: LucideIcon }[] = [
  { title: "Cắt và gia công CNC", icon: ScanLine },
  { title: "Dán chỉ", icon: CircleDotDashed },
  { title: "Thiết kế theo hình ảnh, yêu cầu", icon: Layers3 },
  { title: "Báo giá rõ ràng trước khi cắt", icon: PenTool },
];

const preferredThanhThuyIds = [
  "thanh-thuy:301",
  "thanh-thuy:0029",
  "thanh-thuy:021",
  "thanh-thuy:0212",
  "thanh-thuy:0215",
  "thanh-thuy:025",
];

export async function HomeContent() {
  const articles = await getArticles();
  const sortedFeaturedColorCodes = getPublicColorCodes()
    .filter((record) => {
      const supplierName = supplierLabels[record.supplier as keyof typeof supplierLabels];
      return supplierName
        ? buildCatalogueCodeSeo(record, { supplierName }).indexable
        : false;
    })
    .sort((left, right) => right.demandScore - left.demandScore || left.codeRaw.localeCompare(right.codeRaw, "vi"))
    .filter((record, index, records) => records.findIndex((candidate) => candidate.supplier === record.supplier && candidate.codeRaw === record.codeRaw) === index);
  const requiredFeaturedCode = sortedFeaturedColorCodes.find(
    (record) => record.id === "thanh-thuy:301",
  );
  const preferredThanhThuyCodes = [
    requiredFeaturedCode,
    ...preferredThanhThuyIds
      .filter((id) => id !== requiredFeaturedCode?.id)
      .map((id) => sortedFeaturedColorCodes.find((record) => record.id === id)),
  ].filter((record): record is (typeof sortedFeaturedColorCodes)[number] => Boolean(record));
  const supplierQueues = {
    "an-cuong": sortedFeaturedColorCodes.filter((record) => record.supplier === "an-cuong").slice(0, 6),
    "thanh-thuy": preferredThanhThuyCodes,
    "ba-thanh": sortedFeaturedColorCodes.filter((record) => record.supplier === "ba-thanh").slice(0, 6),
  } as const;
  const featuredColorCodes = Array.from({ length: 6 }, (_, index) => [
    supplierQueues["an-cuong"][index],
    supplierQueues["thanh-thuy"][index],
    supplierQueues["ba-thanh"][index],
  ]).flat().filter((record): record is (typeof sortedFeaturedColorCodes)[number] => Boolean(record));
  const latestArticles = articles.slice(0, 3);

  return (
    <>
      <section id="vat-lieu" className="scroll-mt-24 bg-[#f7f9f6] py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionIntro
              eyebrow="Sản phẩm"
              title="MDF, MFC, Plywood và gỗ ghép"
              description="Chọn nhóm vật liệu trước, sau đó mở trang chi tiết để xem hướng sử dụng và thông tin nên gửi khi hỏi quy cách."
            />
            <Link href="/san-pham" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">
              Xem tất cả vật liệu <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div data-product-groups className="mt-10">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-forest-900">Cốt ván / vật liệu chính</h3>
                <span className="text-xs text-slate-500">{coreMaterialCards.length} nhóm</span>
              </div>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {coreMaterialCards.map((material) => (
                  <article key={material.id} data-product-card={material.id} className="group flex flex-col overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_8px_26px_rgba(7,59,40,.055)] transition duration-200 hover:-translate-y-1 hover:border-wood-500/50 hover:shadow-[0_16px_38px_rgba(7,59,40,.1)]">
                    <Link href={material.href} aria-label={`Mở trang ${material.title}`} className="relative block aspect-[4/3] overflow-hidden bg-[#18281f]">
                      <Image src={material.image} alt={material.alt} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-contain transition duration-300 group-hover:scale-[1.025]" />
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-xl font-extrabold leading-7 text-forest-950"><Link href={material.href}>{material.title}</Link></h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{material.description}</p>
                      <Link href={material.href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem {material.title} <ArrowRight size={16} aria-hidden="true" /></Link>
                      {material.children ? (
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-forest-900/10 pt-3 text-xs font-extrabold text-forest-900">
                          {material.children.map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-9 items-center hover:text-wood-600">{label}</Link>)}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-12 border-t border-forest-900/10 pt-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-forest-900">Bề mặt / catalogue</h3>
                <Link href="/catalogue" prefetch={false} className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-wood-600">Mở toàn bộ catalogue <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {surfaceCatalogueCards.map((surface) => (
                  <Link key={surface.id} href={surface.href} prefetch={false} data-product-card={surface.id} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_8px_24px_rgba(7,59,40,.045)] transition duration-200 hover:-translate-y-1 hover:border-wood-500/50">
                    <span className="relative block aspect-[4/3] overflow-hidden bg-[#18281f]">
                      <Image src={surface.image} alt={surface.alt} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-contain transition duration-300 group-hover:scale-[1.025]" />
                    </span>
                    <span className="flex flex-1 items-center justify-between gap-3 p-4">
                      <span>
                        <strong className="block text-base font-extrabold text-forest-950">{surface.title}</strong>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">{surface.description}</span>
                      </span>
                      <ArrowRight size={17} className="shrink-0 text-wood-600" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ma-mau" className="scroll-mt-24 border-y border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionIntro
              title="Mã màu"
              description="Tra cứu theo thương hiệu và mã màu. Mã bề mặt không tự xác định cốt ván; hãy gửi cả nhu cầu sử dụng khi hỏi hàng."
            />
            <Link href="/catalogue" prefetch={false} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">
              Mở catalogue <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[.78fr_1.22fr]">
            <div className="border border-forest-900/10 bg-[#f7f9f6] p-6 sm:p-7">
              <h3 className="text-xl font-extrabold text-forest-950">Mã màu theo vật liệu</h3>
              <p className="mt-4 text-sm leading-6 text-slate-600">Chọn vật liệu, thương hiệu hoặc mã màu trong catalogue. Mã bề mặt không tự xác định cốt ván; hãy gửi cả nhu cầu sử dụng khi hỏi hàng.</p>
              <Link href="/catalogue" prefetch={false} className="mt-6 inline-flex min-h-12 w-full items-center justify-between gap-4 border border-forest-900/20 bg-white px-4 text-sm font-extrabold text-forest-950 hover:border-wood-500 hover:text-wood-600">
                Mở catalogue <span className="grid h-8 w-8 shrink-0 place-items-center border border-forest-900/15"><ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
              <p className="mt-5 text-xs leading-5 text-slate-600">Quy cách, mã màu và tồn kho có thể thay đổi theo từng dòng hàng. Gửi mã hoặc ảnh mẫu để kiểm tra trước khi báo giá.</p>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">MÃ MÀU</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
                {supplierCards.map((supplier) => (
                  <Link key={supplier.slug} href={`/catalogue/${supplier.slug}`} prefetch={false} className="group flex min-h-[142px] min-w-0 flex-col items-center justify-between border border-forest-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(7,59,40,.045)] transition hover:-translate-y-1 hover:border-wood-500/40">
                    <span className="relative block h-14 w-full">
                      <Image src={supplier.logo} alt={`Logo ${supplier.name}`} fill sizes="180px" className="object-contain" />
                    </span>
                    <span className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-extrabold text-forest-950 group-hover:text-wood-600">Mở mã màu <ArrowRight size={14} aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
              {featuredColorCodes.length ? (
                <div className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-extrabold text-forest-950">Một số mã đang có trang tra cứu</h3>
                    <Link href="/catalogue" prefetch={false} className="inline-flex min-h-10 shrink-0 items-center gap-2 text-xs font-extrabold text-wood-600">Tìm mã khác <ArrowRight size={15} aria-hidden="true" /></Link>
                  </div>
                  <div className="color-code-slider mt-4 min-w-0 flex gap-3 overflow-x-auto pb-3" data-color-code-slider aria-label="Một số mã màu nổi bật">
                    {featuredColorCodes.map((record) => (
                      <Link key={record.id} href={record.canonicalRoute} className="group flex min-h-[13rem] w-[12.5rem] shrink-0 snap-start flex-col justify-end gap-3 border border-forest-900/10 bg-[#fbfcfa] p-3 hover:border-wood-500/50">
                        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-[#edf1ec]">
                          {record.images[0]?.localPath ? <Image src={record.images[0].localPath} alt={`Mã màu ${record.codeRaw} ${record.displayName || ""}`} fill sizes="200px" className="object-cover transition duration-300 group-hover:scale-[1.025]" /> : null}
                        </span>
                        <span>
                          <span className="block text-[11px] font-extrabold uppercase tracking-[.12em] text-wood-600">{supplierLabels[record.supplier as keyof typeof supplierLabels]}</span>
                          <strong className="mt-1 block text-sm text-forest-950">{record.displayName || record.codeRaw}</strong>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="nang-luc-cnc" className="scroll-mt-24 bg-[#f7f9f6] py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro
            title="Cắt và gia công CNC"
            description="Gửi vật liệu, độ dày, số lượng và file hoặc hình ảnh yêu cầu để xưởng kiểm tra trước."
            centered
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
            <div className="relative min-h-[350px] overflow-hidden rounded-2xl lg:min-h-[470px]">
              <Image src="/images/cnc-service.webp" alt="Đầu máy CNC đang cắt biên dạng trên tấm ván" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Từ file đến đường cắt</p>
                <p className="mt-3 max-w-md text-lg font-extrabold leading-7">Chốt vật liệu, độ dày, đơn vị đo và đường gia công trước khi sản xuất.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cncCapabilities.map(({ title, icon: Icon }) => (
                <article key={title} className="rounded-xl border border-forest-900/10 bg-white p-6 shadow-[0_8px_24px_rgba(7,59,40,.045)]">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#edf4ef] text-forest-900"><Icon size={22} aria-hidden="true" /></span>
                  <h3 className="mt-5 text-lg font-extrabold text-forest-950">{title}</h3>
                </article>
              ))}
              <div className="sm:col-span-2 flex flex-col gap-3 border-t border-forest-900/10 pt-5 sm:flex-row">
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "home_cnc", channel: "zalo" }} className="inline-flex min-h-12 items-center justify-center gap-2 bg-wood-600 px-5 text-sm font-extrabold text-white hover:bg-wood-700">
                  <MessageCircle size={17} aria-hidden="true" /> Liên hệ báo giá
                </TrackedLink>
                <Link href="/gia-cong-cnc" className="inline-flex min-h-12 items-center justify-center gap-2 border border-forest-900/20 px-5 text-sm font-extrabold text-forest-950 hover:border-forest-900">
                  Xem dịch vụ CNC <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="chi-nhanh" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro
            title="Địa chỉ"
            description="Xem tên cửa hàng, địa chỉ và bản đồ của từng chi nhánh trước khi đến."
            centered
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {locations.map((branch) => (
              <div key={branch.id} className="overflow-hidden rounded-2xl border border-forest-900/10 bg-[#f8faf7] shadow-[0_12px_36px_rgba(7,59,40,.07)]">
                <article className="grid sm:grid-cols-[.82fr_1.18fr]">
                  <div className="relative min-h-[250px] sm:min-h-[300px]">
                    <Image src={branch.image} alt={branch.imageAlt} fill sizes="(max-width: 640px) 100vw, 42vw" className="object-cover" />
                  </div>
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

      {latestArticles.length ? (
        <section className="border-t border-forest-900/10 bg-[#f7f9f6] py-14 lg:py-18">
          <div className="container-shell">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <SectionIntro title="Bài viết nổi bật"
                />
              <Link href="/bai-viet" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">Xem tất cả bài viết <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {latestArticles.map((article) => (
                <article key={article.slug} className="border border-forest-900/10 bg-white p-6 shadow-[0_8px_24px_rgba(7,59,40,.045)]">
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-600">{article.category}</p>
                  <h3 className="mt-3 text-lg font-extrabold leading-7 text-forest-950"><Link href={`/bai-viet/${article.slug}`}>{article.title}</Link></h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                  <Link href={`/bai-viet/${article.slug}`} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-extrabold text-wood-600">Đọc bài <ArrowRight size={16} aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

    </>
  );
}
