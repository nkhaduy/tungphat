import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeContent } from "@/components/home/HomeContent";

describe("homepage supplier section", () => {
  it("omits the standalone supplier-brand section while retaining color-code discovery", async () => {
    const html = renderToStaticMarkup(await HomeContent());

    expect(html).not.toContain('id="thuong-hieu"');
    expect(html).not.toContain("Nhà cung cấp vật liệu");
    expect(html).not.toContain("Chọn theo thương hiệu");
    expect(html).toContain('id="ma-mau"');
  });
});
