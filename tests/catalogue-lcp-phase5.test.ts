import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { SupplierMediaGallery } from "@/components/catalog/SupplierMediaGallery";

it("marks the first catalogue detail image as high priority in initial HTML", () => {
  const html = renderToStaticMarkup(createElement(SupplierMediaGallery, { images: [{ src: "/example.webp", alt: "Mẫu ván" }] }));
  expect(html).toMatch(/<img(?=[^>]*alt="Mẫu ván")(?=[^>]*fetchpriority="high")[^>]*>/i);
});
