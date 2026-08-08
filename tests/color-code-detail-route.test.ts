import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SupplierColorCodeRoute from "@/app/catalogue/[supplier]/[material]/[code]/page";

describe("supplier color-code detail route", () => {
  it("keeps the shared public shell around the code-first detail content", async () => {
    const page = await SupplierColorCodeRoute({
      params: Promise.resolve({
        supplier: "an-cuong",
        material: "melamine",
        code: "mfc-ms-465-sc04",
      }),
    });
    const html = renderToStaticMarkup(createElement(() => page));

    expect(html).toContain('id="noi-dung-chinh"');
    expect(html).toContain('aria-label="Điều hướng chính"');
    expect(html).toContain("MFC - MS 465 SC04");
    expect(html).toContain("Media rights: UNCONFIRMED");
  });
});
