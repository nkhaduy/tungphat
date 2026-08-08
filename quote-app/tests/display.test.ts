import { describe, expect, it } from "vitest";
import { buildQuotePdfContentDisposition, buildQuotePdfFilename } from "../src/shared/display";

describe("quote PDF filename", () => {
  it("uses customer, Vietnamese date, and quote sequence", () => {
    expect(buildQuotePdfFilename({ customerName: "Nội thất Mộc Việt", quoteDate: "2026-07-23", quoteNumber: "TP81-230726-001" }))
      .toBe("Nội thất Mộc Việt_BaoGia_TungPhat_230726_001.pdf");
  });

  it("sanitizes unsafe customer names and builds a UTF-8 disposition", () => {
    const quote = { customerName: "Công ty / A", quoteDate: "2026-07-23", quoteNumber: "TP81-230726-012" };
    expect(buildQuotePdfFilename(quote)).toBe("Công ty A_BaoGia_TungPhat_230726_012.pdf");
    const disposition = buildQuotePdfContentDisposition(quote);
    expect(disposition).toContain("filename*=UTF-8''");
    expect(disposition).toContain("Cong ty A_BaoGia_TungPhat_230726_012.pdf");
  });
});
