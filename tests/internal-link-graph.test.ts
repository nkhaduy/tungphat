import { describe, expect, it } from "vitest";
import { analyzeInternalLinkGraph } from "@/lib/internal-link-graph";

describe("internal authority graph", () => {
  it("calculates click depth, link types, and anchor variation", () => {
    const result = analyzeInternalLinkGraph([
      { url: "/", html: '<nav><a href="/san-pham/">Sản phẩm</a></nav><main><a href="/bai-viet/a/">Đọc hướng dẫn</a></main>' },
      { url: "/bai-viet/a/", html: '<main><a href="/tham-chieu-vat-lieu/">ma trận vật liệu</a><a href="/san-pham/">nhóm vật liệu</a></main>' },
      { url: "/san-pham/", html: '<nav aria-label="breadcrumb"><a href="/">Trang chủ</a></nav><main><a href="/tham-chieu-vat-lieu/">bảng dữ liệu</a></main>' },
      { url: "/tham-chieu-vat-lieu/", html: "<main></main>" },
    ]);

    expect(result.byUrl["/tham-chieu-vat-lieu/"]).toMatchObject({ clickDepth: 2, internalInlinks: 2, contextualInlinks: 2 });
    expect(result.byUrl["/san-pham/"]).toMatchObject({ clickDepth: 1, navigationInlinks: 1, contextualInlinks: 1 });
    expect(result.byUrl["/san-pham/"].anchorVariation).toEqual(["nhóm vật liệu", "Sản phẩm"]);
    expect(result.byUrl["/"].breadcrumbInlinks).toBe(1);
  });
});
