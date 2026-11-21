import { expect, it } from "vitest";
import { catalogueImageAlt } from "@/lib/catalog/code-seo";

it("distinguishes swatches, full sheets and room application images for the same code", () => {
  const identity = "Mã ARC 2503 - Acrylic An Cường";
  expect(catalogueImageAlt("swatch", identity)).toBe(`Mẫu bề mặt: ${identity}`);
  expect(catalogueImageAlt("fullsheet", identity)).toBe(`Ảnh toàn tấm: ${identity}`);
  expect(catalogueImageAlt("application", identity)).toBe(`Ảnh ứng dụng tham khảo: ${identity}`);
  expect(catalogueImageAlt("actual-photo", identity)).toBe(`Ảnh vật liệu: ${identity}`);
});
