import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CodeInquiryActions } from "@/components/catalog/CodeInquiryActions";

describe("catalogue detail actions", () => {
  it("keeps copy, Zalo and stock-check actions together in customer order", () => {
    const markup = renderToStaticMarkup(
      createElement(CodeInquiryActions, {
        code: "BT 111",
        supplierName: "Ba Thanh",
      }),
    );

    const copy = markup.indexOf("Sao chép mã BT 111");
    const zalo = markup.indexOf("Gửi mã BT 111 của Ba Thanh qua Zalo");
    const stock = markup.indexOf("Kiểm tra tồn kho");
    expect(copy).toBeGreaterThan(-1);
    expect(copy).toBeLessThan(zalo);
    expect(zalo).toBeLessThan(stock);
  });
});
