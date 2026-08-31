import Link from "next/link";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { MaterialSwatchImage } from "@/components/thanh-thuy/MaterialSwatchImage";
import { ProductCodeActions } from "@/components/thanh-thuy/ProductCodeActions";
import {
  createThanhThuyBreadcrumbSchema,
  createThanhThuyProductSchema,
} from "@/lib/thanh-thuy-schema";
import { thanhThuyPath, type ThanhThuyProduct } from "@/lib/thanh-thuy";

type ThanhThuyProductDetailProps = {
  product: ThanhThuyProduct;
  related: ThanhThuyProduct[];
};

function productIntro(product: ThanhThuyProduct) {
  const group = product.seriesName || product.categoryName;
  const color = product.color ? ` Nhóm màu được ghi nhận: ${product.color}.` : "";
  return `${product.name} thuộc nhóm ${group} của Thanh Thuỳ.${color} Xem mẫu và thông tin đang có trước khi hỏi cốt ván, quy cách hoặc phần gia công.`;
}

export function ThanhThuyProductDetail({
  product,
  related,
}: ThanhThuyProductDetailProps) {
  const path = thanhThuyPath(product.categorySlug, product.slug);
  const breadcrumbItems = [
    { name: "Trang chủ", path: "/" },
    { name: "Thanh Thuỳ", path: "/thuong-hieu/thanh-thuy/" },
    { name: product.categoryName, path: thanhThuyPath(product.categorySlug) },
    { name: product.name, path },
  ];
  return (
    <>
      <JsonLd
        data={[
          createThanhThuyBreadcrumbSchema(breadcrumbItems),
          createThanhThuyProductSchema(product, path),
        ]}
      />
      <div className="bg-[#f6f7f5]">
        <section className="bg-white pb-10 pt-[calc(2.5rem+4.5rem)] lg:pb-16 lg:pt-[calc(4rem+4.5rem)]">
          <div className="container-shell">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
            >
              <Link
                href="/"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600"
              >
                Trang chủ
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href="/thuong-hieu/thanh-thuy/"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600"
              >
                Thanh Thuỳ
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href={thanhThuyPath(product.categorySlug)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600"
              >
                {product.categoryName}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-forest-950">
                {product.code || product.name}
              </span>
            </nav>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
              <div className="overflow-hidden border border-forest-900/10 bg-slate-100">
                <MaterialSwatchImage
                  src={product.image}
                  srcSet={product.imageSrcSet}
                  alt={product.imageAlt}
                  width={product.imageWidth}
                  height={product.imageHeight}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-[.18em] text-forest-700">
                  Thanh Thuỳ · {product.categoryName}
                  {product.seriesName ? ` · ${product.seriesName}` : ""}
                </span>
                <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-.04em] text-forest-950 sm:text-5xl">
                  {product.name}
                </h1>
                <div className="mt-5 inline-flex items-center gap-3 bg-forest-950 px-4 py-3 text-white">
                  <span className="text-xs font-bold uppercase tracking-[.16em] text-white/60">
                    Mã
                  </span>
                  <strong className="text-lg">
                    {product.code || "Chưa xác định"}
                  </strong>
                </div>
                <p className="mt-6 text-base leading-8 text-slate-600">
                  {productIntro(product)}
                </p>
                <div className="mt-6 flex items-start gap-3 border-l-2 border-wood-500 bg-[#fff8ed] p-4 text-sm leading-6 text-forest-950">
                  <Info
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-wood-700"
                    size={18}
                  />
                  <p>
                    Tồn kho và khả năng làm theo quy cách thay đổi theo từng mã.
                    Gửi mã kèm kích thước và số lượng để hỏi trước khi đặt.
                  </p>
                </div>
                {product.code ? (
                  <div className="mt-7">
                    <ProductCodeActions code={product.code} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-20">
          <div className="container-shell grid gap-6 lg:grid-cols-2">
            <article className="bg-white p-6 lg:p-8">
              <h2 className="font-display text-2xl font-extrabold text-forest-950">
                Thông tin mã và bề mặt
              </h2>
              <dl className="mt-6 divide-y divide-slate-100 text-sm">
                {[
                  ["Thương hiệu", "Thanh Thuỳ"],
                  ["Danh mục", product.categoryName],
                  ["Series", product.seriesName],
                  ["Nhóm màu", product.color],
                  ["Nhóm vân", product.pattern],
                  ["Kích thước nguồn", product.dimensions?.join(", ")],
                  ["Độ dày nguồn", product.thicknesses?.join(", ")],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[130px_1fr] gap-4 py-3"
                    >
                      <dt className="font-semibold text-slate-500">{label}</dt>
                      <dd className="break-words font-bold text-forest-950">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>
            </article>
            <article className="bg-forest-950 p-6 text-white lg:p-8">
              <h2 className="font-display text-2xl font-extrabold">
                Ứng dụng và gia công
              </h2>
              <ul className="mt-6 space-y-4">
                {product.applications.map((application) => (
                  <li
                    key={application}
                    className="flex items-start gap-3 text-sm leading-6 text-white/82"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-wood-500"
                      size={18}
                    />
                    {application}
                  </li>
                ))}
                <li className="flex items-start gap-3 text-sm leading-6 text-white/82">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-wood-500"
                    size={18}
                  />
                  Nếu cần cắt ván, dán cạnh hoặc CNC, gửi kèm nền ván, kích thước
                  và file kỹ thuật nếu có.
                </li>
              </ul>
              <Link
                href="/gia-cong-cnc/"
                className="mt-8 inline-flex min-h-11 touch-manipulation items-center gap-2 border border-white/25 px-5 text-sm font-bold transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500"
              >
                Xem dịch vụ CNC <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </article>
          </div>
        </section>

        {related.length ? (
          <section className="bg-white py-14 lg:py-20">
            <div className="container-shell">
              <h2 className="font-display text-2xl font-extrabold text-forest-950">
                Mã Thanh Thuỳ liên quan
              </h2>
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={thanhThuyPath(item.categorySlug, item.slug)}
                    className="border border-forest-900/10 bg-[#fffdf8] p-4 transition-colors hover:border-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2"
                  >
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-forest-700">
                      {item.code || item.categoryName}
                    </p>
                    <h3 className="mt-2 font-extrabold leading-6 text-forest-950">
                      {item.name}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        <section className="bg-[#f6f7f5] py-8">
          <div className="container-shell text-xs leading-5 text-slate-600">
            Thông tin nguồn: {product.sourceName || "Gỗ Thanh Thuỳ"}. Màu và
            vân nên được xem trên mẫu thực tế trước khi đặt; khi cần gia công,
            gửi mã cùng quy cách và file nếu có.
          </div>
        </section>
      </div>
    </>
  );
}
