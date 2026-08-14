import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { AppSettings, QuoteRecord } from "../src/shared/types";
import { buildVietQrUrl } from "../src/shared/vietqr";
import { buildPdfTotalsRows, generateQuotePdf, type QuoteSnapshot } from "../src/worker/pdf";

const root = fileURLToPath(new URL("..", import.meta.url));
const settings: AppSettings = {
  company: { name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ GỖ TÙNG PHÁT", address: "81B Tam Bình, Hiệp Bình, TP.HCM", phone: "0909 259 160", headerContactName: "Mr. Tùng", headerPhone: "0909 259 160", website: "mdftungphat.com", logoPath: "/logo-horizontal.png" },
  bank: { accountNumber: "3191158", bankCode: "ACB", holder: "CTY TNHH THUONG MAI DICH VU GO TUNG PHAT", store: "TUNG PHAT" },
  defaults: { generalNote: "Ghi chú", deliveryNote: "Giao hàng" },
};

function quote(itemCount = 3, remainingAmount = 1_624_000): QuoteRecord {
  const items = Array.from({ length: itemCount }, (_, index) => ({ id: crypto.randomUUID(), position: index + 1, productName: `Ván MDF chống ẩm phủ Melamine dòng ${index + 1} với tên sản phẩm dài để kiểm tra xuống dòng`, specification: "1220 × 2440 × 18 mm", quantity: 2, unit: "Tấm", unitPrice: 203_000, lineTotal: 406_000, note: "Kiểm tra màu và mã trước khi giao" }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return { id: crypto.randomUUID(), quoteNumber: "TP81-220726-001", branchId: "branch-tp81", branchCode: "TP81", branchName: "Tùng Phát 2", branchAddress: "81B Tam Bình, Hiệp Bình, TP.HCM", branchPhone: "0909 259 160", createdBy: "employee", employeeName: "Châu", employeePhone: "0909 111 222", quoteDate: "2026-07-22", customerName: "Công ty Nội thất Mộc Việt", customerPhone: "0909000000", customerAddress: "Thủ Đức", deliveryNote: "Giao tại địa chỉ khách hàng", generalNote: "Vui lòng kiểm tra quy cách trước khi xác nhận", status: "ISSUED", paymentStatus: remainingAmount === 0 ? "PAID" : "DEPOSITED", totals: { subtotal, discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 0, grandTotal: subtotal, depositAmount: subtotal - remainingAmount, remainingAmount }, items, latestPdfKey: null, version: 1, createdAt: "2026-07-22T00:00:00.000Z", updatedAt: "2026-07-22T00:00:00.000Z" };
}

async function assets(withQr: boolean) {
  return {
    fontBytes: (await readFile(`${root}/public/fonts/Montserrat-Regular.ttf`)).buffer,
    boldFontBytes: (await readFile(`${root}/public/fonts/Montserrat-Bold.ttf`)).buffer,
    logoBytes: (await readFile(`${root}/public/logo-horizontal.png`)).buffer,
    logoType: "image/png",
    qrBytes: withQr ? (await readFile(`${root}/public/logo-horizontal.png`)).buffer : null,
    qrType: withQr ? "image/png" : null,
  };
}

function snapshot(sourceQuote: QuoteRecord): QuoteSnapshot {
  return { schemaVersion: 2, quote: sourceQuote, settings: structuredClone(settings), qrUrl: buildVietQrUrl(settings.bank, sourceQuote.totals.remainingAmount), exportedAt: "2026-07-22T02:00:00.000Z", exportedBy: { id: "admin", fullName: "Admin" } };
}

describe("server PDF", () => {
  it("places old debt directly after the grand total without adding it to the total", () => {
    const source = { ...quote(), oldDebtAmount: 450_000 };
    const rows = buildPdfTotalsRows(source);
    const grandTotalIndex = rows.findIndex(([label]) => label === "TỔNG THANH TOÁN");
    expect(rows[grandTotalIndex + 1]).toEqual(["NỢ CŨ", 450_000]);
    expect(source.totals.grandTotal).toBe(source.totals.subtotal);
  });

  it("creates an A4 PDF containing logo/QR assets and all product rows", async () => {
    const source = quote(8);
    const bytes = await generateQuotePdf(snapshot(source), await assets(true));
    const document = await PDFDocument.load(bytes);
    expect(bytes.byteLength).toBeGreaterThan(20_000);
    expect(bytes.byteLength).toBeLessThan(900_000);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(source.items).toHaveLength(8);
    const pdfObjects = document.context.enumerateIndirectObjects().map(([, object]) => object.toString()).join("\n");
    expect(pdfObjects).toContain("Montserrat-Regular");
    expect(pdfObjects).toContain("Montserrat-Bold");
  });

  it("splits a long quote across multiple pages", async () => {
    const bytes = await generateQuotePdf(snapshot(quote(80)), await assets(true));
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(2);
  });

  it("does not require a QR asset when remaining amount is zero", async () => {
    const source = quote(2, 0);
    const snap = snapshot(source);
    expect(snap.qrUrl).toBeNull();
    const bytes = await generateQuotePdf(snap, await assets(false));
    expect(bytes.byteLength).toBeGreaterThan(10_000);
  });

  it("keeps an exported snapshot unchanged after company settings change", () => {
    const stored = JSON.stringify(snapshot(quote()));
    settings.company.name = "TÊN CÔNG TY MỚI";
    expect((JSON.parse(stored) as QuoteSnapshot).settings.company.name).toContain("TÙNG PHÁT");
  });
});
