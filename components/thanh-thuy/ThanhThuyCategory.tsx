import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  ThanhThuyExplorer,
  type ThanhThuyExplorerItem,
} from "@/components/thanh-thuy/ThanhThuyExplorer";
import { getThanhThuyCategoryCopy } from "@/lib/thanh-thuy-seo";
import { createThanhThuyItemListSchema } from "@/lib/thanh-thuy-schema";
import { breadcrumbSchema } from "@/lib/seo";
import type { ThanhThuyCategory } from "@/lib/thanh-thuy";

type ThanhThuyCategoryProps = {
  category: ThanhThuyCategory;
  items: ThanhThuyExplorerItem[];
  zaloUrl: string;
};

export function ThanhThuyCategoryPage({
  category,
  items,
  zaloUrl,
}: ThanhThuyCategoryProps) {
  const copy = getThanhThuyCategoryCopy(category);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Thanh Thuỳ", path: "/thuong-hieu/thanh-thuy/" },
            { name: category.name, path: `/san-pham/${category.slug}/` },
          ]),
          createThanhThuyItemListSchema(
            items.map((item) => ({
              name: item.name,
              categorySlug: item.categorySlug,
              slug: item.slug,
            })),
            `${category.name} Thanh Thuỳ`,
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
                { label: "Thanh Thuỳ", href: "/thuong-hieu/thanh-thuy/" },
                { label: category.name },
              ]}
            />
            <span className="eyebrow mt-4 block">Danh mục Thanh Thuỳ</span>
            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl lg:text-5xl">
              {category.name} Thanh Thuỳ tại Tùng Phát
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
              {copy.description} Tùng Phát hỗ trợ đối chiếu mã, kiểm tra tồn kho
              thực tế và tư vấn quy cách gia công tại TP.HCM.
            </p>
            <ThanhThuyExplorer
              items={items}
              categories={[{ slug: category.slug, name: category.name }]}
              title={`Mã ${category.name} Thanh Thuỳ`}
              compact
            />
          </PageContainer>
        </section>
        <section className="bg-white py-12 lg:py-16">
          <div className="container-shell grid gap-5 md:grid-cols-3">
            {copy.applications.map((application) => (
              <article
                key={application}
                className="border-l-2 border-wood-500 bg-[#fffdf8] p-5"
              >
                <h2 className="text-base font-extrabold text-forest-950">
                  {application}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tư vấn nền ván, màu cạnh và quy cách cắt theo hạng mục thực
                  tế.
                </p>
              </article>
            ))}
          </div>
          <div className="container-shell mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600 focus-visible:ring-2 focus-visible:ring-wood-600"
            >
              <MessageCircle aria-hidden="true" size={17} /> Gửi mã để kiểm tra
            </a>
            <Link
              href="/gia-cong-cnc/"
              className="pressable inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950 hover:border-wood-500 focus-visible:ring-2 focus-visible:ring-wood-600"
            >
              <ArrowRight aria-hidden="true" size={17} /> Dịch vụ cắt và CNC
            </Link>
          </div>
        </section>
        <section className="bg-white py-12 lg:py-16">
          <div className="container-shell">
            <h2 className="font-display text-2xl font-extrabold text-forest-950">
              Cách chọn mã {category.name.toLowerCase()}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {copy.guidance}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/cat-cnc-go/"
                className="inline-flex min-h-11 touch-manipulation items-center gap-2 border border-forest-900/15 px-5 text-sm font-bold text-forest-950 transition-colors hover:border-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600"
              >
                Cắt ván theo kích thước
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link
                href="/lien-he/"
                className="inline-flex min-h-11 touch-manipulation items-center gap-2 border border-forest-900/15 px-5 text-sm font-bold text-forest-950 transition-colors hover:border-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600"
              >
                Liên hệ Tùng Phát
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
