import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuoteGrid } from "../src/client/components/QuoteGrid";
import { MoneyInput } from "../src/client/pages/QuoteEditorPage";

describe("quote editor VAT input", () => {
  it("renders VAT as a manually typed VND amount", () => {
    const html = renderToStaticMarkup(createElement(MoneyInput, {
      name: "vatAmount",
      label: "Thuế VAT",
      value: 125_000,
      onChange: () => undefined,
    }));
    expect(html).toContain('name="vatAmount"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('value="125.000"');
    expect(html).toContain("Thuế VAT");
    expect(html).not.toContain("%");
    expect(html).not.toContain("select");
  });
});


describe("quote grid money input", () => {
  it("renders unit prices with Vietnamese thousand separators", () => {
    const html = renderToStaticMarkup(createElement(QuoteGrid, {
      rows: [{ clientId: "row-1", productName: "MDF", specification: "18mm", quantity: 2, unit: "Tấm", unitPrice: 203_000, discountPercent: 0, note: "" }],
      onChange: () => undefined,
      readOnly: true,
    }));
    expect(html).toContain('value="203.000"');
    expect(html).toContain(">406.000<");
  });

  it("shows the per-product discount and both after-discount amounts in order", () => {
    const html = renderToStaticMarkup(createElement(QuoteGrid, {
      rows: [{ clientId: "row-1", productName: "MDF", specification: "18mm", quantity: 2, unit: "Tấm", unitPrice: 203_000, discountPercent: 20, note: "" }],
      onChange: () => undefined,
      readOnly: true,
    }));
    expect(html).toContain("CK (%)");
    expect(html).toContain("Đơn giá sau CK");
    expect(html).toContain("Thành tiền sau CK");
    expect(html).toContain('value="20"');
    expect(html).toContain(">162.400<");
    expect(html).toContain(">324.800<");
  });
});
