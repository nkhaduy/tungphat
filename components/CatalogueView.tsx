import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, MessageCircle } from "lucide-react";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";
import { AnCuongSampleSearch } from "@/components/catalog/AnCuongSampleSearch";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { anCuongAdapter } from "@/lib/catalog/suppliers";
import type { Brand } from "@/lib/brands";
import { ZALO_URL } from "@/lib/seo";

const liveCatalogueRoutes: Record<
  string,
  { href: string; action: string; description: string }
> = {
  "thanh-thuy": {
    href: "/thuong-hieu/thanh-thuy/",
    action: "Mở catalogue Thanh Thuỳ",
    description:
      "Trang tra cứu Thanh Thuỳ hiện có 348 sản phẩm, nhóm vật liệu, hình và mã để tìm trực tiếp.",
  },
  "ba-thanh": {
    href: "/ma-mau-melamine/ba-thanh/",
    action: "Mở bảng mã Ba Thanh",
    description:
      "Bảng mã Melamine Ba Thanh hiện có 233 mã màu, tìm theo mã và lọc theo nhóm vân hoặc màu.",
  },
};

const brandPagePath = (slug: string) => {
  if (slug === "thanh-thuy" || slug === "ba-thanh")
    return `/thuong-hieu/${slug}/`;
  return `/san-pham/${slug}/`;
};

export function CatalogueView({ brand }: { brand: Brand }) {
  const liveCatalogue = liveCatalogueRoutes[brand.slug];
  const anCuongSamples =
    brand.slug === "an-cuong" ? anCuongAdapter.getSearchEntries() : [];
  const catalogues = brand.catalogues.filter(
    (catalogue) => catalogue.pdfUrl.trim().length > 0,
  );
  const inquiryUrl = buildSupplierZaloInquiryUrl(ZALO_URL, brand.name);

  return (
    <>
      {anCuongSamples.length ? (
        <section className="relative overflow-hidden border-b border-forest-900/10 bg-[#f7f8f5] py-7 sm:py-9 lg:py-12">
          <div
            className="page-hero-pattern pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-25"
            aria-hidden="true"
          />
          <PageContainer className="relative">
            <Breadcrumbs
              items={[
                { label: "Trang chủ", href: "/" },
                { label: "Catalogue", href: "/catalogue/" },
                { label: brand.name },
              ]}
            />
            <div className="mt-4 max-w-4xl">
              <p className="eyebrow">Dữ liệu mẫu có giới hạn</p>
              <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl lg:text-5xl">
                Catalogue An Cường
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
                Tìm trong bảy mẫu dữ liệu hiện có. Trang này không đại diện cho
                toàn bộ catalogue An Cường; hãy liên hệ để kiểm tra mã và phạm
                vi catalogue thực tế.
              </p>
            </div>
            <AnCuongSampleSearch entries={anCuongSamples} />
          </PageContainer>
        </section>
      ) : (
        <PageHero
          compact
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Catalogue", href: "/catalogue/" },
            { label: brand.name },
          ]}
          eyebrow="Bộ mẫu vật liệu"
          title={`Catalogue ${brand.name}`}
          description={
            liveCatalogue
              ? `${brand.name} đã có trang tra cứu riêng tại Tùng Phát để tìm mã, nhóm vật liệu và gửi yêu cầu kiểm tra quy cách.`
              : `Dữ liệu catalogue ${brand.name} hiện có tại Tùng Phát. Gửi mã hoặc nhu cầu để kiểm tra catalogue, quy cách và tình trạng thực tế.`
          }
          image={
            brand.logo
              ? { src: brand.logo, alt: `Logo ${brand.name}`, fit: "contain" }
              : undefined
          }
          actions={
            <>
              <a
                href={inquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Tư vấn catalogue {brand.name}
              </a>
              <Link
                href={brandPagePath(brand.slug)}
                className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"
              >
                Xem trang thương hiệu{" "}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </>
          }
        />
      )}

      {!anCuongSamples.length ? (
        <section className="section-space bg-white">
          <div className="container-shell">
            {liveCatalogue ? (
              <div className="grid gap-6 border border-forest-900/10 bg-[#f7f8f5] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">
                    Trang tra cứu đang hoạt động
                  </p>
                  <h2 className="mt-3 text-2xl font-extrabold text-forest-950">
                    Dữ liệu {brand.name} đã có trang riêng để tìm nhanh hơn.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
                    {liveCatalogue.description}
                  </p>
                </div>
                <Link
                  href={liveCatalogue.href}
                  className="pressable inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-6 text-sm font-extrabold text-white"
                >
                  {liveCatalogue.action}{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            ) : null}

            {catalogues.length ? (
              <div className={liveCatalogue ? "mt-12" : ""}>
                <SectionHeader
                  eyebrow="File đang có"
                  title={`Danh sách catalogue ${brand.name}`}
                  description="Nút xem và tải chỉ xuất hiện khi dữ liệu có URL file đang hoạt động."
                />
                <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {catalogues.map((catalogue) => (
                    <article
                      key={catalogue.name}
                      className="overflow-hidden border border-forest-900/10 bg-white shadow-card"
                    >
                      {catalogue.thumbnail ? (
                        <div className="relative aspect-[16/10]">
                          <Image
                            src={catalogue.thumbnail}
                            alt={catalogue.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <BrandPlaceholder
                          label={catalogue.name}
                          className="aspect-[16/10]"
                        />
                      )}
                      <div className="p-6">
                        <h2 className="text-lg font-extrabold text-forest-950">
                          {catalogue.name}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {catalogue.description}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <a
                            href={catalogue.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-12 items-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white"
                          >
                            Xem file <ArrowRight size={16} aria-hidden="true" />
                          </a>
                          <a
                            href={catalogue.pdfUrl}
                            download
                            className="inline-flex min-h-12 items-center gap-2 border border-forest-900/20 px-5 text-sm font-extrabold text-forest-950"
                          >
                            <Download size={16} aria-hidden="true" />
                            Tải PDF
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : !liveCatalogue ? (
              <EmptyState
                title="Chưa có file catalogue được publish"
                description="Không có URL PDF đã xác minh trong dữ liệu hiện tại. Tùng Phát không tạo liên kết tải giả; vui lòng gửi thương hiệu, mã màu hoặc loại bề mặt để kiểm tra file phù hợp."
                action={
                  <a
                    href={inquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pressable inline-flex min-h-12 items-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white"
                  >
                    <MessageCircle size={17} aria-hidden="true" />
                    Nhận catalogue qua Zalo
                  </a>
                }
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <ContactCTA
        eyebrow="Đối chiếu mã màu"
        title="Gửi mã hoặc ảnh bề mặt cần tìm"
        description="Gửi tên thương hiệu, mã màu, nhóm vật liệu và số lượng dự kiến. Tùng Phát sẽ kiểm tra catalogue và nguồn hàng theo dữ liệu thực tế."
        zaloLabel="Gửi mã qua Zalo"
      />
    </>
  );
}
