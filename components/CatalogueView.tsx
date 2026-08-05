import Link from "next/link";
import { ArrowRight, Info, MessageCircle } from "lucide-react";
import type { Brand } from "@/lib/brands";
import { vi as t } from "@/lib/i18n";
import { anCuongAdapter } from "@/lib/catalog/suppliers";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
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

export function CatalogueView({ brand }: { brand: Brand }) {
  const liveCatalogue = liveCatalogueRoutes[brand.slug];
  const anCuongSamples =
    brand.slug === "an-cuong" ? anCuongAdapter.getSearchEntries() : [];
  const introduction = liveCatalogue
    ? `${brand.name} đã có trang tra cứu riêng tại Tùng Phát để tìm mã, nhóm vật liệu và gửi yêu cầu kiểm tra quy cách.`
    : brand.description || `${t.catalogueDescription} ${brand.name}.`;

  return (
    <main className="bg-white pt-[72px]">
      <section className="bg-forest-950 py-12 text-white lg:py-16">
        <div className="container-shell">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-white/72"
          >
            <Link href="/" className="min-h-11 content-center hover:text-white">
              {t.breadcrumbHome}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white" aria-current="page">
              {t.catalogueTitle} {brand.name}
            </span>
          </nav>
          <div className="mt-7">
            <h1 className="text-balance text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              {t.catalogueTitle} {brand.name}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty leading-7 text-white/80">
              {introduction}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="container-shell">
          {anCuongSamples.length ? (
            <>
              <div className="grid gap-6 border border-forest-900/12 bg-[#f6f7f5] p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-start">
                <Info className="text-wood-700" size={24} aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-extrabold text-forest-950">
                    7 mẫu dữ liệu tham khảo đang có tại Tùng Phát
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Đây là phạm vi dữ liệu mẫu đã được xuất để tra cứu tên, mã
                    và dòng vật liệu. Trang không đại diện cho toàn bộ catalogue
                    An Cường. Hãy gửi mã hoặc nhu cầu để Tùng Phát kiểm tra
                    catalogue, quy cách và tình trạng thực tế.
                  </p>
                </div>
              </div>
              <section
                aria-label="Mẫu dữ liệu An Cường"
                className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {anCuongSamples.map((item) => (
                  <article
                    key={item.code}
                    className="flex min-h-[210px] flex-col border border-forest-900/12 bg-white p-5 shadow-[0_8px_28px_rgba(7,59,40,.05)]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[.65rem] font-extrabold uppercase tracking-[.13em]">
                      <span className="text-wood-700">An Cường</span>
                      <span className="text-slate-500">Dữ liệu mẫu</span>
                    </div>
                    <p
                      className="mt-5 break-words font-mono text-lg font-extrabold text-forest-950"
                      translate="no"
                    >
                      {item.code}
                    </p>
                    <h3 className="mt-2 text-base font-extrabold leading-6 text-forest-950">
                      {item.name}
                    </h3>
                    <dl className="mt-auto grid gap-1 pt-5 text-xs leading-5 text-slate-600">
                      <div>
                        <dt className="inline font-bold text-slate-500">
                          Nhóm:{" "}
                        </dt>
                        <dd className="inline">
                          {item.category || "Chưa phân nhóm"}
                        </dd>
                      </div>
                      {item.series ? (
                        <div>
                          <dt className="inline font-bold text-slate-500">
                            Dòng:{" "}
                          </dt>
                          <dd className="inline">{item.series}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                ))}
              </section>
            </>
          ) : liveCatalogue ? (
            <div className="grid gap-6 border border-forest-900/12 bg-[#f6f7f5] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-700">
                  Trang tra cứu đang hoạt động
                </p>
                <h2 className="mt-3 font-display text-2xl font-extrabold text-forest-950 sm:text-3xl">
                  Dữ liệu {brand.name} đã có trang riêng để tìm nhanh hơn.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {liveCatalogue.description}
                </p>
              </div>
              <Link
                href={liveCatalogue.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-forest-950 px-6 text-sm font-extrabold text-white transition-colors hover:bg-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2"
              >
                {liveCatalogue.action}{" "}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center border border-dashed border-forest-900/25 bg-[#f6f7f5] px-6 text-center text-sm text-slate-600">
              Hãy gửi mã hoặc nhu cầu để Tùng Phát kiểm tra phạm vi catalogue
              phù hợp.
            </div>
          )}

          <div className="mt-12 rounded-lg border border-forest-900/15 bg-[#f6f7f5] p-8 text-center">
            <h2 className="text-xl font-extrabold text-forest-950">
              {t.catalogueRequestCta}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
              Gửi mã hoặc nhu cầu sử dụng để Tùng Phát kiểm tra catalogue, quy
              cách và tình trạng thực tế trước khi báo giá.
            </p>
            <a
              href={buildSupplierZaloInquiryUrl(ZALO_URL, brand.name)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Tư vấn catalogue ${brand.name} qua Zalo`}
              className="mt-6 inline-flex min-h-12 items-center gap-2 bg-wood-700 px-6 text-sm font-bold text-white transition-colors hover:bg-wood-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2"
            >
              Tư vấn catalogue {brand.name}{" "}
              <MessageCircle size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
