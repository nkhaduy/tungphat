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
  PanelTop,
  PenTool,
  Phone,
  Ruler,
  ScanLine,
  Search,
  Send,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { getProducts } from "@/lib/content";
import { locations } from "@/lib/locations";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL } from "@/lib/seo";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

function SectionIntro({
  eyebrow,
  title,
  description,
  centered = false,
}: SectionIntroProps) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`eyebrow ${centered ? "justify-center" : ""}`}>{eyebrow}</p>
      <h2 className="text-balance mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-pretty mt-4 text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

const needCards: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Mua ván nguyên tấm",
    description:
      "Xem các nhóm MDF, gỗ ghép và ván gỗ công nghiệp đang được giới thiệu.",
    href: "/san-pham",
    icon: PanelTop,
  },
  {
    title: "Cắt ván theo kích thước",
    description: "Gửi loại vật liệu, độ dày, kích thước và số lượng cần cắt.",
    href: "/cat-cnc-go",
    icon: Ruler,
  },
  {
    title: "Gia công CNC theo file",
    description:
      "Trao đổi đường cắt, khoan, soi rãnh và biên dạng trước khi chạy máy.",
    href: "/gia-cong-cnc",
    icon: Settings2,
  },
  {
    title: "Tìm mã màu và bề mặt",
    description:
      "Tham khảo nhóm catalogue và xác nhận lại mã hàng trước khi đặt.",
    href: "/catalogue",
    icon: Search,
  },
];

const materials = [
  {
    name: "Ván MDF",
    href: "/van-mdf",
    image: "/wood/mdfmfc.webp",
    alt: "Các tấm ván MDF dùng để tham khảo nhóm vật liệu",
  },
  {
    name: "MDF chống ẩm",
    href: "/mdf-chong-am",
    image: "/wood/vanchongam.webp",
    alt: "Tấm MDF chống ẩm lõi xanh dùng để tham khảo vật liệu",
  },
  {
    name: "Ván MFC",
    href: "/van-go-cong-nghiep",
    image: "/wood/melamine.webp",
    alt: "Bề mặt phủ melamine dùng trên nhóm ván MFC",
  },
  {
    name: "Plywood",
    href: "/van-go-cong-nghiep",
    image: "/wood/plywood.webp",
    alt: "Các lớp vật liệu của tấm plywood",
  },
  {
    name: "Gỗ ghép cao su",
    href: "/go-ghep-cao-su",
    image: "/images/wood-panels.webp",
    alt: "Các tấm gỗ ghép dùng để tham khảo vật liệu",
  },
  {
    name: "Gỗ ghép tràm",
    href: "/go-ghep-tram",
    image: "/wood/veneer.webp",
    alt: "Bề mặt vân gỗ dùng để tham khảo nhóm gỗ ghép tràm",
  },
  {
    name: "Melamine",
    href: "/catalogue",
    image: "/wood/melamine.webp",
    alt: "Mẫu bề mặt melamine vân gỗ",
  },
  {
    name: "Laminate, Acrylic & Veneer",
    href: "/catalogue",
    image: "/wood/laminate.webp",
    alt: "Mẫu bề mặt laminate dùng để tham khảo catalogue",
  },
] as const;

const cncCapabilities: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Cắt theo kích thước",
    description:
      "Đối chiếu danh sách chi tiết, vật liệu và độ dày đã xác nhận.",
    icon: ScanLine,
  },
  {
    title: "Khoan liên kết",
    description:
      "Kiểm tra vị trí, đường kính và mặt gia công từ thông tin kỹ thuật.",
    icon: CircleDotDashed,
  },
  {
    title: "Soi rãnh",
    description:
      "Làm rõ chiều rộng, chiều sâu và hướng rãnh trước khi chạy máy.",
    icon: Layers3,
  },
  {
    title: "Cắt biên dạng",
    description:
      "Gia công chi tiết theo đường cắt trong file hoặc bản phác thảo đã duyệt.",
    icon: PenTool,
  },
  {
    title: "Cắt hoa văn",
    description:
      "Kiểm tra đường trùng, điểm hở và tỷ lệ trước khi xếp lịch gia công.",
    icon: Box,
  },
];

const gallery = [
  {
    src: "/images/cnc-service.webp",
    alt: "Máy CNC tại Tùng Phát đang gia công một tấm ván",
    label: "Máy CNC đang gia công",
  },
  {
    src: "/images/contact/chi-nhanh-1.webp",
    alt: "Mặt tiền cửa hàng Tùng Phát tại 14 Tam Bình",
    label: "Mặt tiền chi nhánh 1",
  },
  {
    src: "/images/contact/chi-nhanh-2.webp",
    alt: "Mặt tiền chi nhánh Tùng Phát tại 81B Tam Bình",
    label: "Mặt tiền chi nhánh 2",
  },
] as const;

const brands = [
  {
    name: "An Cường",
    href: "/catalogue/an-cuong/",
    logo: "/partners/an-cuong-logo.webp",
    action: "tra cứu catalogue",
  },
  {
    name: "Thanh Thuỳ",
    href: "/thuong-hieu/thanh-thuy/",
    logo: "/partners/thanh-thuy-logo.webp",
    action: "xem catalogue",
  },
  {
    name: "Ba Thanh",
    href: "/ma-mau-melamine/ba-thanh/",
    logo: "/partners/ba-thanh-logo.webp",
    action: "xem bảng mã",
  },
] as const;

export function HomeContent() {
  const products = getProducts();
  const publishedProductSlugs = new Set(
    products.map((product) => product.slug),
  );
  const commonSpecProducts = [
    "van-mdf",
    "mdf-chong-am",
    "go-ghep-cao-su",
    "go-ghep-tram",
  ]
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product),
    );

  return (
    <>
      <section className="bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro
            eyebrow="Chọn đúng hướng trao đổi"
            title="Bạn đang cần gì?"
            centered
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {needCards.map(({ title, description, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[230px] flex-col rounded-xl border border-forest-900/10 bg-white p-6 shadow-[0_10px_30px_rgba(7,59,40,.05)] transition duration-200 hover:-translate-y-1 hover:border-wood-500/50 hover:shadow-[0_18px_42px_rgba(7,59,40,.1)]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#edf4ef] text-forest-900 transition group-hover:bg-forest-900 group-hover:text-white">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-extrabold text-forest-950">
                  {title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                  {description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-wood-600">
                  Xem hướng phù hợp <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        id="vat-lieu"
        className="scroll-mt-24 bg-[#f7f9f6] py-16 lg:py-24"
      >
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionIntro
              eyebrow="Vật liệu đang giới thiệu"
              title="Danh mục vật liệu chính"
              description="Các trang chi tiết và hình ảnh dưới đây được nối tới nội dung đã có trong website; mã hàng và tình trạng cung cấp được xác nhận khi trao đổi thực tế."
            />
            <Link
              href="/san-pham"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-extrabold text-forest-950 hover:text-wood-600"
            >
              Xem toàn bộ vật liệu <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {materials.map((material) => {
              const isPublishedRoute =
                material.href.includes("#") ||
                publishedProductSlugs.has(material.href.slice(1));
              if (!isPublishedRoute) return null;
              return (
                <article
                  key={material.name}
                  className="group flex flex-col overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_8px_26px_rgba(7,59,40,.055)] transition duration-200 hover:-translate-y-1 hover:border-wood-500/50 hover:shadow-[0_16px_38px_rgba(7,59,40,.1)]"
                >
                  <Link
                    href={material.href}
                    aria-label={`Xem quy cách ${material.name}`}
                    className="relative block aspect-[4/3] overflow-hidden bg-[#ecefe9]"
                  >
                    <Image
                      src={material.image}
                      alt={material.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.025]"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-extrabold leading-6 text-forest-950">
                      <Link href={material.href}>{material.name}</Link>
                    </h3>
                    <div className="mt-5 grid gap-2">
                      <Link
                        href={material.href}
                        className="inline-flex min-h-11 items-center justify-between gap-2 rounded-md border border-forest-900/15 px-3 text-xs font-extrabold text-forest-950 hover:border-forest-900"
                      >
                        Xem quy cách{" "}
                        <BookOpenCheck size={16} aria-hidden="true" />
                      </Link>
                      <TrackedLink
                        href={ZALO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        eventName="request_quote"
                        eventProperties={{
                          location: "home_material_card",
                          material: material.name,
                          channel: "zalo",
                        }}
                        aria-label={`Kiểm tra hàng / báo giá ${material.name}`}
                        className="inline-flex min-h-11 items-center justify-between gap-2 rounded-md bg-[#edf4ef] px-3 text-xs font-extrabold text-forest-900 hover:bg-forest-900 hover:text-white"
                      >
                        Kiểm tra hàng / báo giá{" "}
                        <MessageCircle size={16} aria-hidden="true" />
                      </TrackedLink>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro
            eyebrow="Dữ liệu từ trang sản phẩm"
            title="Quy cách vật liệu thường được hỏi"
            description="CMS hiện chưa công bố bảng kích thước hoặc độ dày cố định. Các giá trị dưới đây giữ nguyên cách diễn đạt trong landing page sản phẩm để tránh suy đoán thông số."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {commonSpecProducts.map((product) => (
              <article
                key={product.slug}
                className="rounded-xl border border-forest-900/10 bg-[#f8faf7] p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-forest-900 shadow-sm">
                  <FileCheck2 size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-forest-950">
                  {product.materialType}
                </h3>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-extrabold text-forest-950">Độ dày</dt>
                    <dd className="mt-1 leading-6 text-slate-600">
                      {product.thicknesses.join("; ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-extrabold text-forest-950">
                      Quy cách tấm
                    </dt>
                    <dd className="mt-1 leading-6 text-slate-600">
                      {product.dimensions.join("; ")}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/${product.slug}`}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600"
                >
                  Xem landing page <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9f6] py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro
            eyebrow="So sánh nhanh"
            title="Chọn vật liệu theo nhu cầu"
            description="Bảng này dẫn tới các landing page có thật và chỉ nêu hướng tìm hiểu ban đầu. Quyết định cuối cùng cần dựa trên mã hàng, điều kiện sử dụng và mẫu thực tế."
          />
          <div className="mt-9 grid gap-4 md:hidden">
            {[
              [
                "Chi tiết nội thất dạng tấm",
                "Ván MDF",
                "Kiểm tra loại cốt, độ dày, bề mặt và môi trường sử dụng.",
                "/van-mdf",
              ],
              [
                "Khu vực có độ ẩm cao hơn điều kiện khô",
                "MDF chống ẩm",
                "Không đồng nghĩa chống nước; cần xác nhận mã hàng và xử lý cạnh.",
                "/mdf-chong-am",
              ],
              [
                "Bề mặt gỗ tự nhiên dạng tấm",
                "Gỗ ghép cao su",
                "Kiểm tra phân hạng, mặt sử dụng, màu và mắt gỗ trên mẫu thực tế.",
                "/go-ghep-cao-su",
              ],
              [
                "Phôi gỗ ghép theo quy cách",
                "Gỗ ghép tràm",
                "Xác nhận lô hàng, phân hạng bề mặt và yêu cầu hoàn thiện.",
                "/go-ghep-tram",
              ],
            ].map(([need, name, note, href]) => (
              <article
                key={need}
                className="rounded-xl border border-forest-900/10 bg-white p-5"
              >
                <p className="text-xs font-extrabold uppercase tracking-[.12em] text-wood-600">
                  {need}
                </p>
                <h3 className="mt-3 text-lg font-extrabold text-forest-950">
                  {name}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>
                <Link
                  href={href}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-900"
                >
                  Xem vật liệu <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-9 hidden overflow-hidden rounded-xl border border-forest-900/10 bg-white md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-forest-900 text-white">
                <tr>
                  <th className="p-5 text-sm font-extrabold">Nhu cầu</th>
                  <th className="p-5 text-sm font-extrabold">
                    Vật liệu nên tìm hiểu
                  </th>
                  <th className="p-5 text-sm font-extrabold">
                    Điểm cần xác nhận
                  </th>
                  <th className="p-5 text-sm font-extrabold">Landing page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-900/10 text-sm">
                {[
                  [
                    "Chi tiết nội thất dạng tấm",
                    "Ván MDF",
                    "Loại cốt, độ dày, bề mặt và môi trường sử dụng.",
                    "/van-mdf",
                  ],
                  [
                    "Khu vực có độ ẩm cao hơn điều kiện khô",
                    "MDF chống ẩm",
                    "Mã hàng, điều kiện ẩm và phương án xử lý cạnh.",
                    "/mdf-chong-am",
                  ],
                  [
                    "Bề mặt gỗ tự nhiên dạng tấm",
                    "Gỗ ghép cao su",
                    "Phân hạng, mặt sử dụng, màu và mắt gỗ thực tế.",
                    "/go-ghep-cao-su",
                  ],
                  [
                    "Phôi gỗ ghép theo quy cách",
                    "Gỗ ghép tràm",
                    "Lô hàng, phân hạng bề mặt và yêu cầu hoàn thiện.",
                    "/go-ghep-tram",
                  ],
                ].map(([need, name, note, href]) => (
                  <tr key={need}>
                    <td className="p-5 font-bold text-forest-950">{need}</td>
                    <td className="p-5 font-extrabold text-forest-950">
                      {name}
                    </td>
                    <td className="p-5 leading-6 text-slate-600">{note}</td>
                    <td className="p-5">
                      <Link
                        href={href}
                        className="inline-flex min-h-11 items-center gap-2 font-extrabold text-wood-600"
                      >
                        Xem vật liệu <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        id="nang-luc-cnc"
        className="scroll-mt-24 bg-white py-16 lg:py-24"
      >
        <div className="container-shell">
          <SectionIntro
            eyebrow="Gia công tại xưởng"
            title="Năng lực gia công CNC"
            description="Tùng Phát tiếp nhận các thao tác đã được mô tả trong nội dung dịch vụ hiện tại và xác nhận chi tiết kỹ thuật trước khi chạy máy."
            centered
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
            <div className="relative min-h-[380px] overflow-hidden rounded-2xl lg:min-h-[570px]">
              <Image
                src="/images/cnc-service.webp"
                alt="Đầu máy CNC đang cắt biên dạng trên tấm ván"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">
                  Từ file đến đường cắt
                </p>
                <p className="mt-3 max-w-md text-lg font-extrabold leading-7">
                  Vật liệu, độ dày, đơn vị đo và đường gia công cần được chốt
                  trước khi sản xuất.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cncCapabilities.map(
                ({ title, description, icon: Icon }, index) => (
                  <article
                    key={title}
                    className={`rounded-xl border border-forest-900/10 bg-[#fbfcfa] p-6 ${index === cncCapabilities.length - 1 ? "sm:col-span-2" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#edf4ef] text-forest-900">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className="text-xs font-extrabold text-wood-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-6 text-lg font-extrabold text-forest-950">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#edf4ef] py-16 lg:py-20">
        <div className="container-shell grid overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-[0_20px_60px_rgba(7,59,40,.09)] lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-6 sm:p-9 lg:p-12">
            <SectionIntro
              eyebrow="Nhận file - kiểm tra quy cách"
              title="Gửi file và quy cách để nhận báo giá"
              description="Website hiện không tải file trực tiếp. Hãy gửi file qua Zalo cùng thông tin vật liệu, độ dày, số lượng và yêu cầu gia công để Tùng Phát kiểm tra."
            />
            <div
              className="mt-7 flex flex-wrap gap-2"
              aria-label="Định dạng file được nêu trong điều khoản website"
            >
              {["DXF", "DWG", "PDF", "AI", "CDR"].map((format) => (
                <span
                  key={format}
                  className="rounded-md border border-forest-900/15 bg-[#f7f9f6] px-3 py-2 text-xs font-extrabold text-forest-950"
                >
                  {format}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                eventName="request_quote"
                eventProperties={{
                  location: "home_file_quote",
                  channel: "zalo",
                }}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-wood-500 px-6 text-sm font-extrabold text-white transition hover:bg-wood-600"
              >
                <Send size={17} aria-hidden="true" /> Gửi file nhận báo giá
              </TrackedLink>
              <Link
                href="/gia-cong-cnc"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-forest-900/20 px-6 text-sm font-extrabold text-forest-950 hover:border-forest-900"
              >
                Xem hướng dẫn CNC <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="border-t border-forest-900/10 bg-[#f8faf7] p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-12">
            <h3 className="text-xl font-extrabold text-forest-950">
              Thông tin nên gửi kèm
            </h3>
            <ul className="mt-6 space-y-4">
              {[
                "Loại vật liệu, độ dày và bề mặt nếu đã xác định.",
                "Kích thước, số lượng tấm hoặc danh sách chi tiết.",
                "Đơn vị đo, đường cắt và bản PDF/ảnh để đối chiếu.",
                "Yêu cầu khoan, soi rãnh, mặt gia công và xử lý cạnh nếu có.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                >
                  <Check
                    size={18}
                    className="mt-0.5 shrink-0 text-forest-800"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-7 border-l-2 border-wood-500 pl-4 text-xs leading-5 text-slate-600">
              Báo giá và lịch gia công chỉ được xác nhận sau khi kiểm tra nội
              dung thực tế; homepage không công bố thời gian xử lý cố định.
            </p>
          </div>
        </div>
      </section>

      <section
        id="thu-vien-xuong"
        className="scroll-mt-24 bg-white py-16 lg:py-24"
      >
        <div className="container-shell">
          <SectionIntro
            eyebrow="Tư liệu đang có"
            title="Đơn hàng và thành phẩm thực tế tại Tùng Phát"
            description="Repo chưa có case study khách hàng đủ dữ liệu để công bố. Khu vực này hiện chỉ hiển thị quá trình CNC và mặt tiền hai chi nhánh, không đặt tên dự án hoặc khách hàng giả."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {gallery.map((item, index) => (
              <figure
                key={item.src}
                className={`group overflow-hidden rounded-xl border border-forest-900/10 bg-[#f7f9f6] ${index === 0 ? "md:col-span-2" : ""}`}
              >
                <div
                  className={`relative overflow-hidden ${index === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes={
                      index === 0
                        ? "(max-width: 768px) 100vw, 66vw"
                        : "(max-width: 768px) 100vw, 33vw"
                    }
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <figcaption className="px-5 py-4 text-sm font-extrabold text-forest-950">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-forest-900/10 bg-[#f7f9f6] py-14 lg:py-18">
        <div className="container-shell">
          <SectionIntro
            eyebrow="Danh mục tham khảo"
            title="Các thương hiệu vật liệu Tùng Phát đang cung cấp"
            description="Việc hiển thị thương hiệu không phải tuyên bố đại lý hoặc nhà phân phối chính thức; khách hàng nên kiểm tra mã và nguồn hàng trên báo giá thực tế."
            centered
          />
          <ul className="mx-auto mt-9 grid max-w-5xl gap-4 sm:grid-cols-3">
            {brands.map((brand) => (
              <li key={brand.name}>
                <Link
                  href={brand.href}
                  aria-label={`${brand.name} - ${brand.action}`}
                  className="group flex min-h-[150px] items-center justify-center rounded-xl border border-forest-900/10 bg-white p-7 shadow-[0_8px_24px_rgba(7,59,40,.045)] transition hover:-translate-y-1 hover:border-wood-500/40"
                >
                  <span className="relative block h-[72px] w-full max-w-[220px]">
                    <Image
                      src={brand.logo}
                      alt={`Logo ${brand.name}`}
                      fill
                      sizes="220px"
                      className="object-contain"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-shell">
          <SectionIntro
            eyebrow="Địa điểm Tùng Phát"
            title="Hệ thống hai chi nhánh tại TP.HCM"
            description="Địa chỉ, hotline và đường dẫn chỉ đường lấy trực tiếp từ cấu hình doanh nghiệp hiện tại."
            centered
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {locations.map((branch) => (
              <article
                key={branch.id}
                id={branch.id}
                className="grid overflow-hidden rounded-2xl border border-forest-900/10 bg-[#f8faf7] shadow-[0_12px_36px_rgba(7,59,40,.07)] sm:grid-cols-[.9fr_1.1fr]"
              >
                <div className="relative min-h-[280px] sm:min-h-[340px]">
                  <Image
                    src={branch.image}
                    alt={branch.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, 45vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col p-6 sm:p-7">
                  <span className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">
                    {branch.shortId}
                  </span>
                  <h3 className="mt-3 text-xl font-extrabold text-forest-950">
                    {branch.name}
                  </h3>
                  <p className="mt-4 flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-forest-800"
                      aria-hidden="true"
                    />
                    {branch.address}
                  </p>
                  <a
                    href={PHONE_HREF}
                    className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-extrabold text-forest-950 hover:text-wood-600"
                  >
                    <Phone
                      size={17}
                      className="text-wood-600"
                      aria-hidden="true"
                    />
                    {PHONE_DISPLAY}
                  </a>
                  <a
                    href={branch.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-forest-900 px-5 text-sm font-extrabold text-white transition hover:bg-forest-800"
                  >
                    Xem chỉ đường <ExternalLink size={16} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#edf4ef] py-14 lg:py-18">
        <div className="container-shell flex flex-col items-start justify-between gap-7 rounded-2xl bg-forest-950 p-7 text-white shadow-[0_18px_50px_rgba(7,59,40,.16)] sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.17em] text-orange-300">
              Trao đổi nhu cầu thực tế
            </p>
            <h2 className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">
              Bạn đã có quy cách vật liệu hoặc file CNC?
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Gửi thông tin đang có để Tùng Phát kiểm tra vật liệu, nội dung gia
              công và những điểm cần làm rõ trước khi báo giá.
            </p>
          </div>
          <TrackedLink
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            eventName="request_quote"
            eventProperties={{ location: "home_final_cta", channel: "zalo" }}
            className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-md bg-wood-500 px-6 text-sm font-extrabold text-white transition hover:bg-wood-600"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Gửi quy cách nhận báo giá
          </TrackedLink>
        </div>
      </section>
    </>
  );
}
