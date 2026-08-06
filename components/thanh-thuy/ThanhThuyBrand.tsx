import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import {
  ThanhThuyExplorer,
  type ThanhThuyExplorerItem,
} from "@/components/thanh-thuy/ThanhThuyExplorer";
import {
  absoluteUrl,
  breadcrumbSchema,
  PHONE_DISPLAY,
  PHONE_HREF,
} from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";
import { createThanhThuyItemListSchema } from "@/lib/thanh-thuy-schema";
import type { ThanhThuyCategory } from "@/lib/thanh-thuy";

type ThanhThuyBrandProps = {
  items: ThanhThuyExplorerItem[];
  categories: ThanhThuyCategory[];
  zaloUrl: string;
  locations: Array<{ id: string; name: string; address: string }>;
};

export function ThanhThuyBrandPage({
  items,
  categories,
  zaloUrl,
  locations,
}: ThanhThuyBrandProps) {
  const topCategories = categories.filter((category) => !category.parentSlug);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Thanh Thuỳ", path: "/thuong-hieu/thanh-thuy/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Catalogue Thanh Thuỳ tại Tùng Phát",
            url: absoluteUrl("/thuong-hieu/thanh-thuy/"),
          },
          createThanhThuyItemListSchema(
            topCategories.map((category) => ({
              name: category.name,
              path: `/san-pham/${category.slug}/`,
            })),
            "Nhóm vật liệu Thanh Thuỳ",
          ),
        ]}
      />
      <div className="bg-[#f6f7f5]">
        <section className="relative overflow-hidden border-b border-forest-900/10 bg-[#f7f8f5] py-7 sm:py-9 lg:py-12">
          <div
            className="page-hero-pattern pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-25"
            aria-hidden="true"
          />
          <PageContainer className="relative">
            <Breadcrumbs
              items={[
                { label: "Trang chủ", href: "/" },
                { label: "Thanh Thuỳ" },
              ]}
            />
            <span className="eyebrow mt-4 block">Thương hiệu vật liệu</span>
            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl lg:text-5xl">
              Catalogue Thanh Thuỳ tại Tùng Phát
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
              Tìm theo mã, tên hoặc nhóm vật liệu. Liên hệ Tùng Phát để đối
              chiếu mẫu, cốt ván, quy cách và tình trạng hàng thực tế.
            </p>
            <ThanhThuyExplorer items={items} categories={categories} compact />
          </PageContainer>
        </section>
        <section className="bg-white py-14 lg:py-20">
          <div className="container-shell">
            <div className="mb-8 max-w-2xl">
              <span className="eyebrow eyebrow-on-light">DUYỆT THEO NHÓM</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.03em] text-forest-950">
                Chưa có mã? Bắt đầu từ loại bề mặt.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Bề mặt tạo màu và vân; cốt MDF, MDF chống ẩm hoặc vật liệu nền
                cần được chọn riêng theo hạng mục sử dụng.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {topCategories.map((category, index) => (
                <Link
                  key={category.slug}
                  href={`/san-pham/${category.slug}/`}
                  className="group border border-forest-900/10 bg-[#fffdf8] p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(10,42,28,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2"
                >
                  <span className="text-xs font-extrabold uppercase tracking-[.18em] text-forest-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-3 text-xl font-extrabold text-forest-950">
                    {category.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Tra cứu nhóm mã, vân và màu để chọn mẫu phù hợp.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-forest-700">
                    Xem danh mục{" "}
                    <ArrowRight
                      aria-hidden="true"
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-forest-950 py-16 text-white lg:py-20">
          <div className="container-shell grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <span className="eyebrow eyebrow-on-dark">
                HỖ TRỢ TẠI TÙNG PHÁT
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">
                Mã màu chỉ là bước đầu của một hạng mục hoàn thiện.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/75">
                Tùng Phát có thể tiếp nhận yêu cầu cắt ván, dán cạnh và gia công
                CNC theo mã màu sau khi xác nhận mẫu, quy cách và file kỹ thuật.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600 focus-visible:ring-2 focus-visible:ring-wood-500"
                >
                  <MessageCircle size={17} aria-hidden="true" /> Gửi mã qua Zalo
                </a>
                <a
                  href={PHONE_HREF}
                  className="pressable inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-5 text-sm font-extrabold text-white hover:border-white focus-visible:ring-2 focus-visible:ring-wood-500"
                >
                  <Phone size={17} aria-hidden="true" /> {PHONE_DISPLAY}
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Đối chiếu mã và mẫu thực tế",
                "Kiểm tra tồn kho và báo giá",
                "Cắt ván theo kích thước",
                "Dán cạnh và gia công CNC",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 border-b border-white/15 py-3 text-sm font-bold text-white/90"
                >
                  <Check
                    aria-hidden="true"
                    size={18}
                    className="mt-0.5 shrink-0 text-wood-500"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-white py-14 lg:py-20">
          <div className="container-shell">
            <h2 className="font-display text-2xl font-extrabold text-forest-950">
              Tùng Phát tại TP.HCM
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Liên hệ trước khi đến để xác nhận mã, mẫu và quy cách cần lấy.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {locations.map((location) => (
                <article
                  key={location.id}
                  className="border border-forest-900/10 bg-[#fffdf8] p-5"
                >
                  <h3 className="font-extrabold text-forest-950">
                    {location.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {location.address}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-8 text-xs leading-5 text-slate-600">
              Dữ liệu mã và hình mẫu được Tùng Phát tổng hợp từ catalogue công
              khai của Gỗ Thanh Thuỳ; tình trạng cung ứng cần được xác nhận tại
              thời điểm đặt hàng.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
