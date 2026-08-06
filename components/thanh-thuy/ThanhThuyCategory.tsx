import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
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
  categories: Array<Pick<ThanhThuyCategory, "slug" | "name" | "parentSlug">>;
  zaloUrl: string;
};

export function ThanhThuyCategoryPage({
  category,
  items,
  categories,
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
        <section className="bg-forest-950 py-16 text-white lg:py-20">
          <div className="container-shell">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm text-white/65"
            >
              <Link
                href="/"
                className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500"
              >
                Trang chủ
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href="/thuong-hieu/thanh-thuy/"
                className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500"
              >
                Thanh Thuỳ
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white">{category.name}</span>
            </nav>
            <span className="eyebrow eyebrow-on-dark mt-8 block">
              DANH MỤC THANH THUỲ
            </span>
            <h1 className="mt-4 max-w-4xl text-balance font-display text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">
              {category.name} Thanh Thuỳ tại Tùng Phát
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/78">
              {copy.description} Tùng Phát hỗ trợ đối chiếu mã, kiểm tra tồn kho
              thực tế và tư vấn quy cách gia công tại TP.HCM.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 bg-[#b84f05] px-6 text-sm font-bold transition-colors hover:bg-[#963f04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500 active:scale-[.98]"
              >
                <MessageCircle aria-hidden="true" size={17} /> Gửi mã để kiểm tra
              </a>
              <Link
                href="/gia-cong-cnc/"
                className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 border border-white/30 px-6 text-sm font-bold text-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500"
              >
                <ArrowRight aria-hidden="true" size={17} /> Dịch vụ cắt và CNC
              </Link>
            </div>
          </div>
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
        </section>
        <ThanhThuyExplorer
          items={items}
          categories={categories}
          title={`Mã ${category.name} Thanh Thuỳ`}
        />
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
