import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuoteQuickViewModal } from "../src/client/components/QuoteQuickViewModal";
import type { QuoteRecord } from "../src/shared/types";

const quote: QuoteRecord = {
  id: "quote-1",
  quoteNumber: "TP81-140826-001",
  branchId: "branch-tp81",
  branchCode: "TP81",
  branchName: "Tùng Phát 2",
  branchAddress: "81B Tam Bình",
  branchPhone: "0909 000 000",
  createdBy: "employee-1",
  employeeName: "Ms. Lành",
  employeePhone: "0909 111 222",
  quoteDate: "2026-08-14",
  customerName: "Công ty Mộc Việt",
  customerPhone: "0909 333 444",
  customerAddress: "Thủ Đức",
  deliveryNote: "Giao tại công trình",
  generalNote: "",
  vatRate: 8,
  status: "DEPOSITED",
  paymentStatus: "DEPOSITED",
  totals: { subtotal: 1_000_000, discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 80_000, grandTotal: 1_080_000, depositAmount: 200_000, remainingAmount: 880_000 },
  items: [{ id: "item-1", position: 1, productName: "MDF chống ẩm", specification: "18mm", quantity: 2, unit: "Tấm", unitPrice: 500_000, lineTotal: 1_000_000, note: "" }],
  latestPdfKey: null,
  version: 2,
  createdAt: "2026-08-14T01:00:00.000Z",
  updatedAt: "2026-08-14T01:00:00.000Z",
};

describe("admin dashboard quick view", () => {
  it("renders customer-first quote details in a read-only dialog", () => {
    const html = renderToStaticMarkup(createElement(QuoteQuickViewModal, {
      quote,
      loading: false,
      error: "",
      onClose: vi.fn(),
      onRetry: vi.fn(),
    }));
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Công ty Mộc Việt");
    expect(html).toContain("TP81-140826-001");
    expect(html).toContain("Đã nhận");
    expect(html).toContain("MDF chống ẩm");
    expect(html).toContain("Đóng");
    expect(html).toContain('href="/bao-gia/quote-1/chinh-sua"');
    expect(html).toContain("Chỉnh báo giá");
  });

  it("omits the specification column when no product has one", () => {
    const withoutSpecifications = { ...quote, items: quote.items.map((item) => ({ ...item, specification: "" })) };
    const html = renderToStaticMarkup(createElement(QuoteQuickViewModal, {
      quote: withoutSpecifications,
      loading: false,
      error: "",
      onClose: vi.fn(),
      onRetry: vi.fn(),
    }));
    expect(html).not.toContain("Quy cách");
  });

  it("keeps obsolete history navigation and admin filter copy out of the UI", async () => {
    const shell = await readFile(fileURLToPath(new URL("../src/client/components/AppShell.tsx", import.meta.url)), "utf8");
    const list = await readFile(fileURLToPath(new URL("../src/client/pages/QuoteListPage.tsx", import.meta.url)), "utf8");
    expect(shell).not.toContain('label: "Lịch sử"');
    expect(list).not.toContain("Tra cứu theo nhân viên, chi nhánh, khách hàng và trạng thái.");
  });

  it("keeps payment editing available after an order is marked paid", async () => {
    const dashboard = await readFile(fileURLToPath(new URL("../src/client/pages/AdminDashboardPage.tsx", import.meta.url)), "utf8");
    expect(dashboard).not.toContain('quote.paymentStatus !== "PAID" ? <PaymentActions');
  });
});
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
