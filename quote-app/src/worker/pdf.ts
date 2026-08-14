import fontkit from "@pdf-lib/fontkit";
import type { Context } from "hono";
import { PDFDocument, type PDFFont, type PDFImage, type PDFPage, rgb } from "pdf-lib";
import { deriveQuoteStatus, formatVnd } from "../shared/calculations";
import { OFFICIAL_BRANCHES } from "../shared/branches";
import { buildQuotePdfContentDisposition, formatEmployeeContact } from "../shared/display";
import { paymentReceivedLabel, shouldShowPaymentQr } from "../shared/payment";
import { shouldShowSpecificationColumn } from "../shared/display";
import type { AppSettings, QuoteRecord } from "../shared/types";
import { buildVietQrUrl } from "../shared/vietqr";
import { auditStatement } from "./audit";
import type { AppBindings } from "./auth";
import { HttpError, isoNow, requiredParam } from "./http";
import { validateRasterImage } from "./images";
import { loadQuote } from "./quotes";
import { getSettings } from "./settings";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 32;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;
const PAYMENT_WIDTH = 274;
const TOTALS_WIDTH = 242;
const SUMMARY_GAP = CONTENT_WIDTH - PAYMENT_WIDTH - TOTALS_WIDTH;
const GREEN = rgb(0.027, 0.231, 0.157);
const DARK = rgb(0.075, 0.13, 0.098);
const MUTED = rgb(0.34, 0.39, 0.36);
const LIGHT = rgb(0.94, 0.97, 0.95);
const PALE = rgb(0.985, 0.99, 0.987);
const ORANGE = rgb(0.929, 0.463, 0.063);

export type QuoteSnapshot = {
  schemaVersion: 2;
  quote: QuoteRecord;
  settings: AppSettings;
  qrUrl: string | null;
  exportedAt: string;
  exportedBy: { id: string; fullName: string };
  headerBranches?: Array<{ code: string; name: string; address: string }>;
};

type PdfAssets = {
  fontBytes: ArrayBuffer;
  boldFontBytes?: ArrayBuffer;
  logoBytes: ArrayBuffer;
  logoType: string;
  qrBytes: ArrayBuffer | null;
  qrType: string | null;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of String(text || "").split(/\r?\n/)) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word;
        continue;
      }
      let fragment = "";
      for (const character of word) {
        const next = fragment + character;
        if (font.widthOfTextAtSize(next, size) > maxWidth && fragment) {
          lines.push(fragment);
          fragment = character;
        } else {
          fragment = next;
        }
      }
      current = fragment;
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

function drawLines(page: PDFPage, lines: string[], options: { x: number; y: number; font: PDFFont; size: number; color?: ReturnType<typeof rgb>; lineHeight?: number; align?: "left" | "right"; width?: number }): number {
  const lineHeight = options.lineHeight ?? options.size * 1.3;
  lines.forEach((line, index) => {
    const width = options.font.widthOfTextAtSize(line, options.size);
    const x = options.align === "right" && options.width ? options.x + options.width - width : options.x;
    page.drawText(line, { x, y: options.y - index * lineHeight, font: options.font, size: options.size, color: options.color ?? DARK });
  });
  return options.y - lines.length * lineHeight;
}

function drawLabelValue(page: PDFPage, label: string, value: string, options: { x: number; y: number; width: number; regular: PDFFont; bold: PDFFont; size: number; color?: ReturnType<typeof rgb>; lineHeight?: number; align?: "left" | "right" }): number {
  const prefix = `${label}: `;
  const lineHeight = options.lineHeight ?? options.size * 1.35;
  const prefixWidth = options.bold.widthOfTextAtSize(prefix, options.size);
  const valueWidth = options.regular.widthOfTextAtSize(value, options.size);
  if (prefixWidth + valueWidth <= options.width) {
    const startX = options.align === "right" ? options.x + options.width - prefixWidth - valueWidth : options.x;
    page.drawText(prefix, { x: startX, y: options.y, font: options.bold, size: options.size, color: options.color ?? DARK });
    page.drawText(value, { x: startX + prefixWidth, y: options.y, font: options.regular, size: options.size, color: options.color ?? DARK });
    return options.y - lineHeight;
  }
  const prefixX = options.align === "right" ? options.x + options.width - prefixWidth : options.x;
  page.drawText(prefix, { x: prefixX, y: options.y, font: options.bold, size: options.size, color: options.color ?? DARK });
  return drawLines(page, wrapText(value, options.regular, options.size, options.width), {
    x: options.x,
    y: options.y - lineHeight,
    font: options.regular,
    size: options.size,
    lineHeight,
    color: options.color,
    align: options.align,
    width: options.width,
  });
}

async function embedImage(pdf: PDFDocument, bytes: ArrayBuffer, contentType: string): Promise<PDFImage> {
  if (contentType.includes("png")) return pdf.embedPng(bytes);
  return pdf.embedJpg(bytes);
}

export async function fetchBounded(
  url: string,
  maxBytes: number,
  fetcher: typeof fetch = fetch,
  timeoutMs = 3_500,
): Promise<{ bytes: ArrayBuffer; contentType: "image/png" | "image/jpeg" }> {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "vietqr.app") throw new HttpError(502, "Nguồn ảnh VietQR không hợp lệ.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(parsedUrl, { redirect: "manual", signal: controller.signal });
    if (response.status >= 300 && response.status < 400) throw new HttpError(502, "VietQR chuyển hướng đến nguồn không được phép.");
    if (!response.ok) throw new HttpError(502, "Không thể tải ảnh VietQR.");
    const length = Number(response.headers.get("Content-Length") ?? 0);
    if (Number.isFinite(length) && length > maxBytes) throw new HttpError(502, "Ảnh VietQR vượt quá kích thước cho phép.");
    const contentType = response.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "image/png" && contentType !== "image/jpeg") throw new HttpError(502, "VietQR không trả về ảnh hợp lệ.");
    if (!response.body) throw new HttpError(502, "VietQR không trả về nội dung ảnh.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new HttpError(502, "Ảnh VietQR vượt quá kích thước cho phép.");
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let image: ReturnType<typeof validateRasterImage>;
    try {
      image = validateRasterImage(bytes.buffer, contentType, { maxWidth: 2_048, maxHeight: 2_048, maxPixels: 4_000_000 });
    } catch {
      throw new HttpError(502, "VietQR không trả về ảnh hợp lệ.");
    }
    return { bytes: bytes.buffer, contentType: image.contentType };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.warn(JSON.stringify({ message: "vietqr_fetch_failed", error: error instanceof Error ? error.message : String(error) }));
    throw new HttpError(502, "Không thể tải ảnh VietQR trong thời gian cho phép.");
  } finally {
    clearTimeout(timeout);
  }
}

async function loadLogo(env: QuoteAppEnv, settings: AppSettings, requestUrl: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  if (settings.company.logoKey) {
    const object = await env.PDF_BUCKET.get(settings.company.logoKey);
    if (object) {
      const bytes = await object.arrayBuffer();
      const image = validateRasterImage(bytes, object.httpMetadata?.contentType ?? null);
      return { bytes, contentType: image.contentType };
    }
  }
  const response = await env.ASSETS.fetch(new URL(settings.company.logoPath, requestUrl));
  if (!response.ok) throw new HttpError(500, "Không tìm thấy logo công ty.");
  const bytes = await response.arrayBuffer();
  const image = validateRasterImage(bytes, response.headers.get("Content-Type"));
  return { bytes, contentType: image.contentType };
}

async function loadAsset(env: QuoteAppEnv, path: string, requestUrl: string, message: string): Promise<ArrayBuffer> {
  const response = await env.ASSETS.fetch(new URL(path, requestUrl));
  if (!response.ok) throw new HttpError(500, message);
  return response.arrayBuffer();
}

function drawCompanyHeader(page: PDFPage, regular: PDFFont, bold: PDFFont, logo: PDFImage, snapshot: QuoteSnapshot): number {
  const { settings } = snapshot;
  const infoWidth = 350;
  const logoAreaWidth = CONTENT_WIDTH - infoWidth - 24;
  const infoX = MARGIN + logoAreaWidth + 24;
  const logoWidth = Math.min(145, logoAreaWidth - 4);
  const logoHeight = Math.min(66, logo.height * (logoWidth / logo.width));
  const topY = A4[1] - MARGIN - 2;
  let y = topY;
  y = drawLines(page, wrapText(settings.company.name, bold, 10.8, infoWidth), { x: infoX, y, font: bold, size: 10.8, lineHeight: 14.2, color: GREEN, align: "right", width: infoWidth });
  const branches = snapshot.headerBranches?.length ? snapshot.headerBranches : OFFICIAL_BRANCHES;
  const cn1 = branches.find((branch) => branch.code === "TP14")?.address ?? OFFICIAL_BRANCHES[0].address;
  const cn2 = branches.find((branch) => branch.code === "TP81")?.address ?? OFFICIAL_BRANCHES[1].address;
  y = drawLabelValue(page, "CN1", cn1, { x: infoX, y: y - 1, width: infoWidth, regular, bold, size: 8.7, lineHeight: 11.5, color: MUTED, align: "right" });
  y = drawLabelValue(page, "CN2", cn2, { x: infoX, y: y - 1, width: infoWidth, regular, bold, size: 8.7, lineHeight: 11.5, color: MUTED, align: "right" });
  y = drawLabelValue(page, "SĐT", `${settings.company.headerContactName} - ${settings.company.headerPhone}`, { x: infoX, y: y - 1, width: infoWidth, regular, bold, size: 8.7, lineHeight: 11.5, color: MUTED, align: "right" });
  y = drawLabelValue(page, "Website", settings.company.website, { x: infoX, y: y - 1, width: infoWidth, regular, bold, size: 8.7, lineHeight: 11.5, color: MUTED, align: "right" });
  const infoBottom = y;
  const infoHeight = topY - infoBottom;
  page.drawImage(logo, {
    x: MARGIN + (logoAreaWidth - logoWidth) / 2,
    y: topY - (infoHeight + logoHeight) / 2 + 2,
    width: logoWidth,
    height: logoHeight,
  });
  const dividerY = infoBottom - 8;
  page.drawLine({ start: { x: MARGIN, y: dividerY }, end: { x: A4[0] - MARGIN, y: dividerY }, thickness: 1.2, color: GREEN });
  return dividerY - 23;
}

function drawQuoteIntro(page: PDFPage, regular: PDFFont, bold: PDFFont, snapshot: QuoteSnapshot, startY: number): number {
  const { quote } = snapshot;
  const title = "BẢNG BÁO GIÁ";
  const titleWidth = bold.widthOfTextAtSize(title, 20);
  page.drawText(title, { x: (A4[0] - titleWidth) / 2, y: startY, font: bold, size: 20, color: GREEN });
  let y = startY - 28;
  const formatDate = (value: string) => value.split("-").reverse().join("/");
  const meta = [
    ["Mã báo giá", quote.quoteNumber, "Ngày lập", formatDate(quote.quoteDate)],
    ["Chi nhánh", `${quote.branchName} (${quote.branchAddress})`, "Người lập", formatEmployeeContact(quote.employeeName, quote.employeePhone)],
  ];
  const metaGap = 30;
  const rightMetaWidth = 190;
  const leftMetaWidth = CONTENT_WIDTH - metaGap - rightMetaWidth;
  for (const [leftLabel, leftValue, rightLabel, rightValue] of meta) {
    const leftLines = wrapText(`${leftLabel}: ${leftValue}`, regular, 9.3, leftMetaWidth);
    const rightLines = wrapText(`${rightLabel}: ${rightValue}`, regular, 9.3, rightMetaWidth);
    drawLabelValue(page, leftLabel, leftValue, { x: MARGIN, y, width: leftMetaWidth, regular, bold, size: 9.3, lineHeight: 12.5, color: DARK });
    drawLabelValue(page, rightLabel, rightValue, { x: MARGIN + leftMetaWidth + metaGap, y, width: rightMetaWidth, regular, bold, size: 9.3, lineHeight: 12.5, color: DARK, align: "right" });
    y -= Math.max(leftLines.length, rightLines.length, 1) * 12.5 + 4;
  }
  const customerValues = [
    ["Khách hàng", quote.customerName || "-"],
    ["Điện thoại", quote.customerPhone || "-"],
    ["Địa chỉ", quote.customerAddress || "-"],
  ] as const;
  const customerLineCount = customerValues.reduce((count, [label, value]) => count + Math.max(1, wrapText(`${label}: ${value}`, regular, 9.3, CONTENT_WIDTH - 20).length), 0);
  const customerLineHeight = 15.5;
  const boxHeight = Math.max(68, customerLineCount * customerLineHeight + 20);
  page.drawRectangle({ x: MARGIN, y: y - boxHeight + 5, width: CONTENT_WIDTH, height: boxHeight, color: LIGHT });
  let customerY = y - 11;
  customerValues.forEach(([label, value]) => {
    customerY = drawLabelValue(page, label, value, { x: MARGIN + 10, y: customerY, width: CONTENT_WIDTH - 20, regular, bold, size: 9.3, lineHeight: customerLineHeight, color: DARK });
  });
  return y - boxHeight - 8;
}

type Column = { key: string; label: string; width: number; align?: "right" };
function tableColumns(quote: QuoteRecord): Column[] {
  const showNote = quote.items.some((item) => item.note.trim());
  const showSpecification = shouldShowSpecificationColumn(quote.items);
  const definitions = showNote && showSpecification ? [
    ["position", "STT", 0.055], ["product", "Tên sản phẩm", 0.23], ["spec", "Quy cách", 0.16],
    ["quantity", "SL", 0.075], ["unit", "ĐVT", 0.07], ["price", "Đơn giá", 0.14],
    ["total", "Thành tiền", 0.145], ["note", "Ghi chú", 0.125],
  ] : showNote ? [
    ["position", "STT", 0.055], ["product", "Tên sản phẩm", 0.32], ["quantity", "SL", 0.075],
    ["unit", "ĐVT", 0.07], ["price", "Đơn giá", 0.14], ["total", "Thành tiền", 0.145], ["note", "Ghi chú", 0.195],
  ] : showSpecification ? [
    ["position", "STT", 0.06], ["product", "Tên sản phẩm", 0.30], ["spec", "Quy cách", 0.19],
    ["quantity", "SL", 0.08], ["unit", "ĐVT", 0.08], ["price", "Đơn giá", 0.14],
    ["total", "Thành tiền", 0.15],
  ] : [
    ["position", "STT", 0.06], ["product", "Tên sản phẩm", 0.49], ["quantity", "SL", 0.08],
    ["unit", "ĐVT", 0.08], ["price", "Đơn giá", 0.14], ["total", "Thành tiền", 0.15],
  ];
  return definitions.map(([key, label, ratio], index) => ({
    key: String(key),
    label: String(label),
    width: index === definitions.length - 1 ? CONTENT_WIDTH - definitions.slice(0, -1).reduce((total, current) => total + CONTENT_WIDTH * Number(current[2]), 0) : CONTENT_WIDTH * Number(ratio),
    align: new Set(["quantity", "price", "total"]).has(String(key)) ? "right" as const : undefined,
  }));
}

function drawTableHeader(page: PDFPage, font: PDFFont, y: number, columns: Column[]): number {
  const height = 27;
  page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_WIDTH, height, color: GREEN });
  let x = MARGIN;
  columns.forEach((column, index) => {
    const width = font.widthOfTextAtSize(column.label, 8.1);
    const textX = column.align === "right" ? x + column.width - width - 5 : x + 5;
    page.drawText(column.label, { x: textX, y: y - 17.2, font, size: 8.1, color: rgb(1, 1, 1) });
    x += column.width;
    if (index < columns.length - 1) page.drawLine({ start: { x, y }, end: { x, y: y - height }, thickness: 0.45, color: rgb(0.3, 0.53, 0.44) });
  });
  return y - height;
}

function itemValues(quote: QuoteRecord, index: number): Record<string, string> {
  const item = quote.items[index];
  return {
    position: String(index + 1),
    product: item.productName,
    spec: item.specification,
    quantity: item.quantity.toLocaleString("vi-VN"),
    unit: item.unit,
    price: item.unitPrice.toLocaleString("vi-VN"),
    total: item.lineTotal.toLocaleString("vi-VN"),
    note: item.note,
  };
}

function measureItemRow(font: PDFFont, quote: QuoteRecord, index: number, columns: Column[]): { wrapped: string[][]; height: number } {
  const values = itemValues(quote, index);
  const wrapped = columns.map((column) => wrapText(values[column.key] ?? "", font, 8.2, column.width - 10));
  return { wrapped, height: Math.max(29, Math.max(...wrapped.map((lines) => lines.length)) * 11.2 + 11) };
}

function drawItemRow(page: PDFPage, regular: PDFFont, quote: QuoteRecord, index: number, y: number, wrapped: string[][], rowHeight: number, columns: Column[]): number {
  page.drawRectangle({ x: MARGIN, y: y - rowHeight, width: CONTENT_WIDTH, height: rowHeight, color: index % 2 ? PALE : rgb(1, 1, 1), opacity: 0.93, borderColor: rgb(0.82, 0.86, 0.83), borderWidth: 0.35, borderOpacity: 1 });
  page.drawLine({ start: { x: MARGIN, y: y - rowHeight }, end: { x: A4[0] - MARGIN, y: y - rowHeight }, thickness: 0.4, color: rgb(0.82, 0.86, 0.83) });
  let x = MARGIN;
  columns.forEach((column, columnIndex) => {
    drawLines(page, wrapped[columnIndex], { x: x + 5, y: y - 13, font: regular, size: 8.2, lineHeight: 11.2, color: DARK, align: column.align, width: column.width - 10 });
    x += column.width;
    if (columnIndex < columns.length - 1) page.drawLine({ start: { x, y }, end: { x, y: y - rowHeight }, thickness: 0.35, color: rgb(0.82, 0.86, 0.83) });
  });
  return y - rowHeight;
}

export function buildPdfTotalsRows(quote: QuoteRecord): Array<[string, number]> {
  const rows: Array<[string, number]> = [
    ["Tiền hàng", quote.totals.subtotal], ["Chiết khấu", -quote.totals.discount], ["Phí vận chuyển", quote.totals.shippingFee],
    ["Phí gia công", quote.totals.processingFee], ["Thuế VAT", quote.totals.vatAmount], ["TỔNG THANH TOÁN", quote.totals.grandTotal],
  ];
  if ((quote.oldDebtAmount ?? 0) > 0) rows.push(["NỢ CŨ", quote.oldDebtAmount ?? 0]);
  rows.push([paymentReceivedLabel(quote.paymentStatus), quote.totals.depositAmount], ["CÒN LẠI", quote.totals.remainingAmount]);
  return rows;
}

function drawTotals(page: PDFPage, regular: PDFFont, bold: PDFFont, quote: QuoteRecord, x: number, y: number): number {
  const rows = buildPdfTotalsRows(quote);
  const boxWidth = TOTALS_WIDTH;
  const rowHeight = 22;
  const topPadding = 6;
  const boxHeight = rows.length * rowHeight + topPadding;
  page.drawRectangle({ x, y: y - boxHeight, width: boxWidth, height: boxHeight, color: rgb(0.985, 0.99, 0.987), borderColor: rgb(0.82, 0.88, 0.84), borderWidth: 0.6 });
  rows.forEach(([label, value], index) => {
    const highlight = label === "CÒN LẠI";
    const oldDebt = label === "NỢ CŨ";
    const font = label.includes("TỔNG") || highlight || oldDebt ? bold : regular;
    const size = label.includes("TỔNG") || highlight || oldDebt ? 10 : 9.2;
    const rowBottom = y - topPadding - (index + 1) * rowHeight;
    const baseline = rowBottom + (rowHeight - size) / 2 + 1.7;
    if (highlight) page.drawRectangle({ x, y: rowBottom, width: boxWidth, height: rowHeight, color: ORANGE });
    if (oldDebt) page.drawRectangle({ x, y: rowBottom, width: boxWidth, height: rowHeight, color: rgb(1, 0.94, 0.84) });
    const color = highlight ? rgb(1, 1, 1) : oldDebt ? ORANGE : DARK;
    const normalizedValue = Object.is(value, -0) ? 0 : value;
    const display = normalizedValue < 0 ? `-${formatVnd(Math.abs(normalizedValue))}` : formatVnd(normalizedValue);
    page.drawText(label, { x: x + 9, y: baseline, font, size, color });
    page.drawText(display, { x: x + boxWidth - 9 - bold.widthOfTextAtSize(display, 9.6), y: baseline, font: bold, size: 9.6, color });
  });
  return y - boxHeight;
}

function drawPayment(page: PDFPage, regular: PDFFont, bold: PDFFont, snapshot: QuoteSnapshot, qr: PDFImage | null, x: number, y: number): number {
  const width = PAYMENT_WIDTH;
  const height = 182;
  page.drawRectangle({ x, y: y - height, width, height, color: LIGHT });
  page.drawText("THÔNG TIN CHUYỂN KHOẢN", { x: x + 10, y: y - 18, font: bold, size: 10.2, color: GREEN });
  let textY = y - 40;
  const lines: Array<[string, string]> = [
    ["Ngân hàng", snapshot.settings.bank.bankCode],
    ["Số tài khoản", snapshot.settings.bank.accountNumber],
    ["Chủ tài khoản", snapshot.settings.bank.holder],
  ];
  for (const [label, value] of lines) {
    page.drawText(`${label}:`, { x: x + 10, y: textY, font: bold, size: 8.8, color: MUTED });
    const detailWidth = qr ? 122 : width - 20;
    const wrapped = wrapText(value, bold, 9.2, detailWidth);
    textY = drawLines(page, wrapped, { x: x + 10, y: textY - 12, font: bold, size: 9.2, lineHeight: 11.2, color: DARK }) - 4;
  }
  if (qr) {
    const scale = Math.min(128 / qr.width, 138 / qr.height);
    const qrWidth = qr.width * scale;
    const qrHeight = qr.height * scale;
    page.drawImage(qr, { x: x + width - qrWidth - 10, y: y - qrHeight - 34, width: qrWidth, height: qrHeight });
  } else if (snapshot.quote.paymentStatus === "PAID") {
    page.drawText("ĐÃ THANH TOÁN ĐỦ", { x: x + 10, y: y - 124, font: bold, size: 10.5, color: GREEN });
  } else {
    page.drawText("KHÔNG PHÁT SINH THANH TOÁN", { x: x + 10, y: y - 124, font: regular, size: 8.2, color: MUTED });
  }
  return y - height;
}

function addPage(pdf: PDFDocument): PDFPage {
  return pdf.addPage(A4);
}

export async function generateQuotePdf(snapshot: QuoteSnapshot, assets: PdfAssets): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`Báo giá ${snapshot.quote.quoteNumber}`);
  pdf.setAuthor(snapshot.settings.company.name);
  pdf.setCreator("BÁO GIÁ TÙNG PHÁT");
  pdf.setCreationDate(new Date(snapshot.exportedAt));
  const regular = await pdf.embedFont(assets.fontBytes, { subset: false });
  const bold = await pdf.embedFont(assets.boldFontBytes ?? assets.fontBytes, { subset: false });
  const logo = await embedImage(pdf, assets.logoBytes, assets.logoType);
  const qr = assets.qrBytes ? await embedImage(pdf, assets.qrBytes, assets.qrType ?? "image/png") : null;

  let page = addPage(pdf);
  let y = drawCompanyHeader(page, regular, bold, logo, snapshot);
  y = drawQuoteIntro(page, regular, bold, snapshot, y);
  const columns = tableColumns(snapshot.quote);
  y = drawTableHeader(page, bold, y, columns);
  let itemIndex = 0;
  while (itemIndex < snapshot.quote.items.length) {
    const rows: Array<{ index: number; wrapped: string[][]; height: number }> = [];
    let cursor = y;
    while (itemIndex < snapshot.quote.items.length) {
      const measured = measureItemRow(regular, snapshot.quote, itemIndex, columns);
      if (rows.length && cursor - measured.height < 72) break;
      rows.push({ index: itemIndex, ...measured });
      cursor -= measured.height;
      itemIndex += 1;
    }
    rows.forEach((row) => {
      y = drawItemRow(page, regular, snapshot.quote, row.index, y, row.wrapped, row.height, columns);
    });
    if (itemIndex < snapshot.quote.items.length) {
      page = addPage(pdf);
      y = drawTableHeader(page, bold, A4[1] - MARGIN, columns);
    }
  }

  if (y < MARGIN + 245) {
    page = addPage(pdf);
    y = A4[1] - MARGIN;
  }
  const sectionTop = y - 13;
  const paymentBottom = drawPayment(page, regular, bold, snapshot, qr, MARGIN, sectionTop);
  const totalsBottom = drawTotals(page, regular, bold, snapshot.quote, MARGIN + PAYMENT_WIDTH + SUMMARY_GAP, sectionTop);
  let notesY = Math.min(paymentBottom, totalsBottom) - 21;
  if (notesY < 72) {
    page = addPage(pdf);
    notesY = A4[1] - MARGIN;
  }
  const notes = [snapshot.quote.deliveryNote, snapshot.quote.generalNote].filter(Boolean).join("\n");
  if (notes) page.drawText("GHI CHÚ", { x: MARGIN, y: notesY, font: bold, size: 10.2, color: GREEN });
  notesY -= 16;
  for (const line of notes ? wrapText(notes, regular, 9.2, CONTENT_WIDTH) : []) {
    if (notesY < 52) {
      page = addPage(pdf);
      notesY = A4[1] - MARGIN;
      page.drawText("GHI CHÚ (TIẾP)", { x: MARGIN, y: notesY, font: bold, size: 10.2, color: GREEN });
      notesY -= 18;
    }
    page.drawText(line, { x: MARGIN, y: notesY, font: regular, size: 9.2, color: DARK });
    notesY -= 12.5;
  }

  const pages = pdf.getPages();
  pages.forEach((pdfPage, index) => {
    const footer = `${snapshot.quote.quoteNumber} · Trang ${index + 1}/${pages.length}`;
    pdfPage.drawText(footer, { x: A4[0] - MARGIN - regular.widthOfTextAtSize(footer, 7), y: 18, font: regular, size: 7, color: MUTED });
  });
  return pdf.save({ useObjectStreams: true });
}

export async function exportPdfHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  if (quote.status === "CANCELLED") throw new HttpError(409, "Không thể xuất phiên bản mới cho báo giá đã hủy.");
  const settings = await getSettings(c.env);
  const { results: headerBranches } = await c.env.DB.prepare("SELECT code,name,address FROM branches WHERE code IN ('TP14','TP81') AND deleted_at IS NULL ORDER BY code")
    .all<{ code: string; name: string; address: string }>();
  const oldDebtAmount = quote.oldDebtAmount ?? 0;
  const qrUrl = shouldShowPaymentQr(quote.paymentStatus, quote.totals.remainingAmount, oldDebtAmount)
    ? buildVietQrUrl(settings.bank, oldDebtAmount > 0 ? null : quote.totals.remainingAmount)
    : null;
  const exportedAt = isoNow();
  const snapshot: QuoteSnapshot = {
    schemaVersion: 2,
    quote,
    settings,
    qrUrl,
    exportedAt,
    exportedBy: { id: c.get("user").id, fullName: c.get("user").fullName },
    headerBranches,
  };
  const [fontBytes, boldFontBytes, logo, qrImage] = await Promise.all([
    loadAsset(c.env, "/fonts/Montserrat-Regular.ttf", c.req.url, "Không tìm thấy font Montserrat Regular cho PDF."),
    loadAsset(c.env, "/fonts/Montserrat-Bold.ttf", c.req.url, "Không tìm thấy font Montserrat Bold cho PDF."),
    loadLogo(c.env, settings, c.req.url),
    qrUrl ? fetchBounded(qrUrl, 512 * 1024) : Promise.resolve(null),
  ]);
  const pdfBytes = await generateQuotePdf(snapshot, {
    fontBytes,
    boldFontBytes,
    logoBytes: logo.bytes,
    logoType: logo.contentType,
    qrBytes: qrImage?.bytes ?? null,
    qrType: qrImage?.contentType ?? null,
  });
  const nextVersion = await c.env.DB.prepare("UPDATE quotes SET pdf_version=pdf_version+1 WHERE id=?1 RETURNING pdf_version")
    .bind(quote.id).first<{ pdf_version: number }>();
  if (!nextVersion) throw new HttpError(404, "Không tìm thấy báo giá.");
  const versionNumber = nextVersion.pdf_version;
  const versionId = crypto.randomUUID();
  const key = `quotes/${quote.id}/v${versionNumber}/Bao-gia-${quote.quoteNumber}.pdf`;
  try {
    await c.env.PDF_BUCKET.put(key, pdfBytes, {
      httpMetadata: { contentType: "application/pdf", contentDisposition: buildQuotePdfContentDisposition(quote) },
      customMetadata: { quoteId: quote.id, quoteNumber: quote.quoteNumber, version: String(versionNumber) },
    });
    const status = deriveQuoteStatus(quote.status, quote.totals, true);
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO quote_versions(id,quote_id,version_number,snapshot_json,pdf_key,pdf_size,created_by,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)`)
        .bind(versionId, quote.id, versionNumber, JSON.stringify(snapshot), key, pdfBytes.byteLength, c.get("user").id, exportedAt),
      c.env.DB.prepare("UPDATE quotes SET latest_pdf_key=?1,status=?2,updated_at=?3 WHERE id=?4").bind(key, status, exportedAt, quote.id),
      auditStatement(c.env, { actorUserId: c.get("user").id, action: "PDF_EXPORTED", entityType: "QUOTE_VERSION", entityId: versionId, newData: { quoteId: quote.id, versionNumber, pdfSize: pdfBytes.byteLength, status }, requestId: c.get("requestId") }),
    ]);
    return c.json({ ok: true, versionId, versionNumber, downloadUrl: `/api/quote-versions/${versionId}/pdf`, status });
  } catch (error) {
    await c.env.PDF_BUCKET.delete(key).catch(() => undefined);
    throw error;
  }
}

export async function listVersionsHandler(c: Context<AppBindings>): Promise<Response> {
  const quote = await loadQuote(c.env, requiredParam(c, "id"), c.get("user"));
  const { results } = await c.env.DB.prepare(`SELECT v.id,v.version_number,v.pdf_size,v.created_at,u.full_name AS created_by_name FROM quote_versions v JOIN users u ON u.id=v.created_by WHERE v.quote_id=?1 ORDER BY v.version_number DESC`)
    .bind(quote.id).all<{ id: string; version_number: number; pdf_size: number; created_at: string; created_by_name: string }>();
  return c.json({ versions: results.map((row) => ({ id: row.id, versionNumber: row.version_number, pdfSize: row.pdf_size, createdAt: row.created_at, createdByName: row.created_by_name, downloadUrl: `/api/quote-versions/${row.id}/pdf` })) });
}

export async function downloadVersionHandler(c: Context<AppBindings>): Promise<Response> {
  const row = await c.env.DB.prepare("SELECT v.pdf_key,v.snapshot_json,q.created_by FROM quote_versions v JOIN quotes q ON q.id=v.quote_id WHERE v.id=?1")
    .bind(requiredParam(c, "versionId")).first<{ pdf_key: string; snapshot_json: string; created_by: string }>();
  if (!row || (c.get("user").role !== "ADMIN" && row.created_by !== c.get("user").id)) throw new HttpError(404, "Không tìm thấy PDF.");
  const object = await c.env.PDF_BUCKET.get(row.pdf_key);
  if (!object) throw new HttpError(404, "File PDF không còn trong kho lưu trữ.");
  const snapshot = JSON.parse(row.snapshot_json) as QuoteSnapshot;
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", buildQuotePdfContentDisposition(snapshot.quote));
  headers.set("Cache-Control", "private, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
