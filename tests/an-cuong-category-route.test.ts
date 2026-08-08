import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SupplierMaterialRoute, {
  generateMetadata,
  generateStaticParams,
} from "@/app/catalogue/[supplier]/[material]/page";
import { anCuongAdapter } from "@/lib/catalog/suppliers/an-cuong";

describe("An Cuong representative category routes", () => {
  it("publishes useful non-empty material categories with self canonical metadata", async () => {
    const parameters = generateStaticParams();
    expect(parameters).toContainEqual({ supplier: "an-cuong", material: "melamine" });

    const metadata = await generateMetadata({ params: Promise.resolve({ supplier: "an-cuong", material: "melamine" }) });
    expect(metadata.alternates?.canonical).toBe("https://mdftungphat.com/catalogue/an-cuong/melamine/");
    expect(metadata.robots).not.toEqual({ index: false, follow: true });

    const veneerMetadata = await generateMetadata({ params: Promise.resolve({ supplier: "an-cuong", material: "veneer" }) });
    expect(veneerMetadata.alternates?.canonical).toContain("/catalogue/an-cuong/veneer/");
  });

  it("claims only routes that can render an owned page", () => {
    expect(anCuongAdapter.getRouteClaims().map((claim) => claim.path)).toContain("/catalogue/an-cuong/melamine/");
  });

  it("renders distinct useful category copy with breadcrumb and ItemList JSON-LD", async () => {
    const page = await SupplierMaterialRoute({ params: Promise.resolve({ supplier: "an-cuong", material: "melamine" }) });
    const html = renderToStaticMarkup(createElement(() => page));

    expect(html).toContain("Mã màu melamine · An Cường");
    expect(html).toContain("BreadcrumbList");
    expect(html).toContain('id="noi-dung-chinh"');
    expect(html).toContain('aria-label="Điều hướng chính"');
    expect(html).not.toContain("/catalogue/an-cuong/sku/");
  });
});
