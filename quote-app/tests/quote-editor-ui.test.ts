import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
    expect(html).toContain('value="125000"');
    expect(html).toContain("Thuế VAT");
    expect(html).not.toContain("%");
    expect(html).not.toContain("select");
  });
});
