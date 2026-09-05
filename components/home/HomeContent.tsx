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

const coreMaterials = [
  {
    title: "Ván MDF",
    href: "/van-mdf",
    image: "/wood/mdfmfc.webp",
    alt: "Các tấm ván MDF dùng để tham khảo nhóm vật liệu",
    description: "Xem thông tin nền, độ dày và cách gửi quy cách khi hỏi ván MDF.",
  },
  {
    title: "MDF chống ẩm",
    href: "/mdf-chong-am",
    image: "/wood/vanchongam.webp",
    alt: "Tấm MDF chống ẩm dùng để tham khảo vật liệu",
    description: "Tách riêng nhu cầu dùng ở môi trường ẩm hơn phòng khô trước khi hỏi hàng.",
  },
  {
    title: "MFC & Plywood",
    href: "/van-go-cong-nghiep",
    image: "/wood/plywood.webp",
    alt: "Các lớp vật liệu của tấm plywood",
    description: "Mở trang ván gỗ công nghiệp để xem nhóm MFC, Plywood và bề mặt liên quan.",
  },
  {
    title: "Gỗ ghép",
    href: "/go-ghep",
    image: "/images/wood-panels.webp",
    alt: "Các tấm gỗ ghép dùng để tham khảo nhóm vật liệu",
    description: "Bắt đầu từ nhóm gỗ ghép, sau đó chọn cao su hoặc tràm theo hạng mục.",
    children: [
      ["Gỗ ghép cao su", "/go-ghep-cao-su"],
      ["Gỗ ghép tràm", "/go-ghep-tram"],
    ],
  },
] as const;

const surfaceLinks = [
  ["Melamine", "/catalogue/an-cuong/melamine/"],
  ["Laminate", "/catalogue/thanh-thuy/laminate/"],
  ["Acrylic", "/catalogue/an-cuong/acrylic/"],
  ["Veneer", "/catalogue/an-cuong/veneer/"],
  ["PVC và chỉ dán cạnh", "/catalogue/thanh-thuy/pvc/"],
] as const;

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

const cncCapabilities: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Cắt theo kích thước", description: "Gửi danh sách chi tiết, vật liệu, độ dày và số lượng.", icon: ScanLine },
  { title: "Khoan liên kết", description: "Ghi vị trí, đường kính và mặt gia công trên bản vẽ hoặc file.", icon: CircleDotDashed },
  { title: "Soi rãnh", description: "Làm rõ chiều rộng, chiều sâu và hướng rãnh trước khi chạy máy.", icon: Layers3 },
  { title: "Cắt biên dạng", description: "Gửi file hoặc bản phác thảo thể hiện đường cắt cần làm.", icon: PenTool },
];

export async function HomeContent() {
  const articles = await getArticles();
  const featuredColorCodes = getPublicColorCodes()
    .filter((record) => {
      const supplierName = supplierLabels[record.supplier as keyof typeof supplierLabels];
      return supplierName
        ? buildCatalogueCodeSeo(record, { supplierName }).indexable
        : false;
    })
    .sort((left, right) => right.demandScore - left.demandScore || left.codeRaw.localeCompare(right.codeRaw, "vi"))
    .filter((record, index, records) => records.findIndex((candidate) => candidate.supplier === record.supplier && candidate.codeRaw === record.codeRaw) === index)
    .slice(0, 6);
  const latestArticles = articles.slice(0, 3);

  return (
    <>
      <section id="vat-lieu" className="scroll-mt-24 bg-[#f7f9f6] py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionIntro
              eyebrow="Cốt ván / vật liệu"
              title="MDF, MFC, Plywood và gỗ ghép"
              description="Chọn nhóm vật liệu trước, sau đó mở trang chi tiết để xem hướng sử dụng và thông tin nên gửi khi hỏi quy cách."
            />
            <Link href="/san-pham" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">
              Xem tất cả vật liệu <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {coreMaterials.map((material) => (
              <article key={material.href} className="group flex flex-col overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_8px_26px_rgba(7,59,40,.055)] transition duration-200 hover:-translate-y-1 hover:border-wood-500/50 hover:shadow-[0_16px_38px_rgba(7,59,40,.1)]">
                <Link href={material.href} aria-label={`Mở trang ${material.title}`} className="relative block aspect-[4/3] overflow-hidden bg-[#ecefe9]">
                  <Image src={material.image} alt={material.alt} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition duration-300 group-hover:scale-[1.025]" />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-extrabold leading-7 text-forest-950"><Link href={material.href}>{material.title}</Link></h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{material.description}</p>
                  <Link href={material.href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem {material.title} <ArrowRight size={16} aria-hidden="true" /></Link>
                  {"children" in material ? (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-forest-900/10 pt-3 text-xs font-extrabold text-forest-900">
                      {material.children.map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-9 items-center hover:text-wood-600">{label}</Link>)}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ma-mau" className="scroll-mt-24 border-y border-forest-900/10 bg-white py-16 lg:py-24">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionIntro
              eyebrow="Bề mặt / mã màu"
              title="Mã màu và bề mặt"
              description="Melamine, Laminate, Acrylic, Veneer và PVC là các nhóm bề mặt để tra cứu mã. Mã bề mặt không tự xác định cốt ván; hãy gửi cả nhu cầu sử dụng khi hỏi hàng."
            />
            <Link href="/catalogue" prefetch={false} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600">
              Mở catalogue <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[.78fr_1.22fr]">
            <div className="border border-forest-900/10 bg-[#f7f9f6] p-6 sm:p-7">
              <h3 className="text-xl font-extrabold text-forest-950">Chọn nhóm bề mặt</h3>
              <ul className="mt-5 grid gap-1 border-t border-forest-900/10 pt-3">
                {surfaceLinks.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} prefetch={false} className="flex min-h-12 items-center justify-between gap-4 border-b border-forest-900/10 text-sm font-extrabold text-forest-950 hover:text-wood-600">
                      {label}<ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-5 text-slate-600">Quy cách, mã màu và tồn kho có thể thay đổi theo từng dòng hàng. Gửi mã hoặc ảnh mẫu để kiểm tra trước khi báo giá.</p>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">Nhà cung cấp &amp; bảng mã</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {supplierCards.map((supplier) => (
                  <Link key={supplier.slug} href={`/catalogue/${supplier.slug}`} prefetch={false} className="group flex min-h-[142px] flex-col items-center justify-between border border-forest-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(7,59,40,.045)] transition hover:-translate-y-1 hover:border-wood-500/40">
                    <span className="relative block h-14 w-full">
                      <Image src={supplier.logo} alt={`Logo ${supplier.name}`} fill sizes="180px" className="object-contain" />
                    </span>
                    <span className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-extrabold text-forest-950 group-hover:text-wood-600">Mở bảng mã <ArrowRight size={14} aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
              {featuredColorCodes.length ? (
                <div className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-extrabold text-forest-950">Một số mã đang có trang tra cứu</h3>
                    <Link href="/catalogue" prefetch={false} className="inline-flex min-h-10 shrink-0 items-center gap-2 text-xs font-extrabold text-wood-600">Tìm mã khác <ArrowRight size={15} aria-hidden="true" /></Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {featuredColorCodes.map((record) => (
                      <Link key={record.id} href={record.canonicalRoute} className="group flex min-h-20 items-center justify-between gap-4 border border-forest-900/10 bg-[#fbfcfa] px-4 py-3 hover:border-wood-500/50">
                        <span>
                          <span className="block text-[11px] font-extrabold uppercase tracking-[.12em] text-wood-600">{supplierLabels[record.supplier as keyof typeof supplierLabels]}</span>
                          <strong className="mt-1 block text-sm text-forest-950">{record.displayName || record.codeRaw}</strong>
                          <span className="mt-1 block text-xs text-slate-600">Mã {record.codeRaw}</span>
                        </span>
                        <ArrowRight size={17} className="shrink-0 text-forest-900 transition group-hover:translate-x-1" aria-hidden="true" />
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
            eyebrow="Cắt &amp; CNC"
            title="Cắt và gia công CNC theo quy cách"
            description="Gửi file hoặc bản phác thảo cùng vật liệu, độ dày, số lượng và phần việc cần làm để xưởng kiểm tra trước."
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
              {cncCapabilities.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-xl border border-forest-900/10 bg-white p-6 shadow-[0_8px_24px_rgba(7,59,40,.045)]">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#edf4ef] text-forest-900"><Icon size={22} aria-hidden="true" /></span>
                  <h3 className="mt-5 text-lg font-extrabold text-forest-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
              <div className="sm:col-span-2 flex flex-col gap-3 border-t border-forest-900/10 pt-5 sm:flex-row">
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "home_cnc", channel: "zalo" }} className="inline-flex min-h-12 items-center justify-center gap-2 bg-wood-600 px-5 text-sm font-extrabold text-white hover:bg-wood-700">
                  <MessageCircle size={17} aria-hidden="true" /> Gửi quy cách qua Zalo
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
            eyebrow="Địa điểm Tùng Phát"
            title="Xưởng và chi nhánh tại Thủ Đức"
            description="Hai địa chỉ trên đường Tam Bình. Gọi trước nếu bạn cần hỏi mã, quy cách hoặc phần gia công; khi đến có thể mở Maps theo từng chi nhánh."
            centered
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {locations.map((branch) => (
              <article key={branch.id} className="grid overflow-hidden rounded-2xl border border-forest-900/10 bg-[#f8faf7] shadow-[0_12px_36px_rgba(7,59,40,.07)] sm:grid-cols-[.82fr_1.18fr]">
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
            ))}
          </div>
        </div>
      </section>

      {latestArticles.length ? (
        <section className="border-t border-forest-900/10 bg-[#f7f9f6] py-14 lg:py-18">
          <div className="container-shell">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <SectionIntro eyebrow="Kiến thức" title="Kiến thức vật liệu và CNC" description="Một vài bài viết để chuẩn bị thông tin trước khi chọn ván hoặc gửi file."
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

      <section className="bg-[#edf4ef] py-14 lg:py-18">
        <div className="container-shell flex flex-col items-start justify-between gap-7 rounded-2xl bg-forest-950 p-7 text-white shadow-[0_18px_50px_rgba(7,59,40,.16)] sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.17em] text-orange-300">Trao đổi nhu cầu thực tế</p>
            <h2 className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Đã có mã, quy cách hoặc file CNC?</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">Gửi vật liệu, độ dày, kích thước, số lượng và file nếu cần cắt hoặc gia công.</p>
          </div>
          <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "home_final_cta", channel: "zalo" }} className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-md bg-wood-600 px-6 text-sm font-extrabold text-white transition hover:bg-wood-700"><MessageCircle size={18} aria-hidden="true" />Gửi quy cách qua Zalo</TrackedLink>
        </div>
      </section>
    </>
  );
}
