import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CatalogueDeferredImage } from "../components/catalog/CatalogueDeferredImage";

it("keeps offscreen catalogue images out of the initial browser request list", () => {
  const html = renderToStaticMarkup(createElement(CatalogueDeferredImage, { src: "/partners/ba-thanh-logo.png", alt: "", sizes: "96px", className: "object-contain" }));
  expect(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "")).not.toContain('<img');
  expect(html).toContain("<noscript>");
  expect(html).toContain('data-catalogue-deferred-image');
});

it("keeps supplier result images in the initial markup by default", async () => {
  const { CatalogueMaterialCard } = await import("../components/catalog/CatalogueMaterialCard");
  const html = renderToStaticMarkup(createElement(CatalogueMaterialCard, { href: "/catalogue/an-cuong/", supplierId: "an-cuong", supplierName: "An Cường", title: "Mã thử", taxonomy: "Melamine", thumbnail: "/images/test.webp", thumbnailAlt: "Ảnh mẫu" }));
  expect(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "")).toContain('<img');
});
