import type { PaymentStatus, QuoteItemInput, QuoteMoneyInput, QuoteStatus, QuoteTotals } from "./types";

const MAX_VND = Number.MAX_SAFE_INTEGER;
export const QUANTITY_SCALE = 1_000;
const MAX_QUANTITY = 1_000_000_000;

export function assertVnd(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_VND) {
    throw new Error(`${field} phải là số nguyên VND không âm.`);
  }
  return value;
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  assertVnd(unitPrice, "Đơn giá");
  const quantityMilli = quantityToMilli(quantity);
  const scaledTotal = BigInt(quantityMilli) * BigInt(unitPrice);
  const total = (scaledTotal + BigInt(QUANTITY_SCALE / 2)) / BigInt(QUANTITY_SCALE);
  if (total > BigInt(MAX_VND)) throw new Error("Thành tiền vượt quá giới hạn an toàn.");
  return Number(total);
}

export function quantityToMilli(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity < 0 || quantity > MAX_QUANTITY) {
    throw new Error("Số lượng phải là số không âm hợp lệ.");
  }
  const scaled = Math.round(quantity * QUANTITY_SCALE);
  if (!Number.isSafeInteger(scaled) || Math.abs(quantity - scaled / QUANTITY_SCALE) > 1e-9) {
    throw new Error("Số lượng chỉ được có tối đa 3 chữ số thập phân.");
  }
  return scaled;
}

export function quantityFromMilli(quantityMilli: number): number {
  if (!Number.isSafeInteger(quantityMilli) || quantityMilli < 0) throw new Error("Số lượng lưu trữ không hợp lệ.");
  return quantityMilli / QUANTITY_SCALE;
}

export function formatQuantity(quantity: number): string {
  quantityToMilli(quantity);
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(quantity);
}

export function calculateTotals(items: QuoteItemInput[], money: QuoteMoneyInput): QuoteTotals {
  const subtotal = items.reduce((sum, item) => {
    const next = sum + calculateLineTotal(item.quantity, item.unitPrice);
    return assertVnd(next, "Tiền hàng");
  }, 0);
  const discount = assertVnd(money.discount, "Chiết khấu");
  const shippingFee = assertVnd(money.shippingFee, "Phí vận chuyển");
  const processingFee = assertVnd(money.processingFee, "Phí gia công");
  const vatAmount = assertVnd(money.vatAmount, "Thuế VAT");
  const depositAmount = assertVnd(money.depositAmount, "Tiền đã cọc");
  const taxableBase = subtotal - discount + shippingFee + processingFee;
  if (taxableBase < 0) throw new Error("Tổng thanh toán không thể âm.");
  const rawGrandTotal = taxableBase + vatAmount;
  const grandTotal = assertVnd(rawGrandTotal, "Tổng thanh toán");
  if (depositAmount > grandTotal) throw new Error("Tiền đã cọc không thể lớn hơn tổng thanh toán.");
  const remainingAmount = assertVnd(grandTotal - depositAmount, "Còn lại");
  return { subtotal, discount, shippingFee, processingFee, vatAmount, grandTotal, depositAmount, remainingAmount };
}

export function deriveQuoteStatus(current: QuoteStatus, totals: QuoteTotals, hasIssuedVersion: boolean): QuoteStatus {
  if (current === "CANCELLED") return current;
  if (totals.remainingAmount === 0 && totals.grandTotal > 0) return "PAID";
  if (totals.depositAmount > 0 && totals.remainingAmount > 0) return "DEPOSITED";
  return hasIssuedVersion ? "ISSUED" : "DRAFT";
}

export function normalizePayment(paymentStatus: PaymentStatus, receivedAmount: number, grandTotal: number) {
  assertVnd(receivedAmount, "Số tiền đã nhận");
  assertVnd(grandTotal, "Tổng thanh toán");
  if (receivedAmount > grandTotal) throw new Error("Số tiền đã nhận không thể lớn hơn tổng thanh toán.");
  if (paymentStatus === "UNPAID" && receivedAmount !== 0) {
    throw new Error("Đơn chưa thanh toán phải có số tiền đã nhận bằng 0.");
  }
  if ((paymentStatus === "DEPOSITED" || paymentStatus === "PARTIAL") && receivedAmount <= 0) {
    throw new Error("Số tiền đã nhận phải lớn hơn 0.");
  }
  if ((paymentStatus === "DEPOSITED" || paymentStatus === "PARTIAL") && receivedAmount >= grandTotal) {
    throw new Error("Số tiền đã nhận phải nhỏ hơn tổng thanh toán.");
  }
  if (paymentStatus === "PAID" && (grandTotal <= 0 || receivedAmount !== grandTotal)) {
    throw new Error("Trạng thái đã thanh toán phải nhận đủ tổng thanh toán.");
  }
  return { receivedAmount, remainingAmount: grandTotal - receivedAmount };
}

export function derivePaymentStatus(
  requestedStatus: PaymentStatus,
  receivedAmount: number,
  grandTotal: number,
): PaymentStatus {
  normalizePayment(requestedStatus, receivedAmount, grandTotal);
  return requestedStatus;
}

export function paymentStatusFromLegacyQuote(
  legacyStatus: QuoteStatus,
  receivedAmount: number,
  grandTotal: number,
): PaymentStatus {
  if (grandTotal > 0 && receivedAmount >= grandTotal) return "PAID";
  if (legacyStatus === "PAID") return "PAID";
  if (legacyStatus === "DEPOSITED" && receivedAmount > 0 && receivedAmount < grandTotal) return "DEPOSITED";
  return "UNPAID";
}

export function lifecycleStatusForPayment(
  current: QuoteStatus,
  paymentStatus: PaymentStatus,
  hasIssuedVersion: boolean,
): QuoteStatus {
  if (current === "CANCELLED") return current;
  if (paymentStatus === "PAID") return "PAID";
  if (paymentStatus === "DEPOSITED" || paymentStatus === "PARTIAL") return "DEPOSITED";
  return hasIssuedVersion ? "ISSUED" : "DRAFT";
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}
