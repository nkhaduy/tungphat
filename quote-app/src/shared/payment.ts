import type { PaymentQueue, PaymentStatus, QuoteRecord } from "./types";

export const PAYMENT_QUEUE_SECTIONS: Array<{ key: keyof PaymentQueue; label: string; description: string }> = [
  { key: "unpaid", label: "Cần xử lý", description: "Đơn chưa ghi nhận thanh toán" },
  { key: "deposited", label: "Đã cọc", description: "Đơn đã nhận tiền cọc" },
  { key: "partial", label: "Thanh toán một phần", description: "Đơn đang còn số dư" },
  { key: "paid", label: "Đã thanh toán", description: "Đơn đã nhận đủ tổng tiền" },
];

export function paymentActionAmount(
  paymentStatus: PaymentStatus,
  grandTotal: number,
  currentReceivedAmount: number,
): number {
  if (paymentStatus === "UNPAID") return 0;
  if (paymentStatus === "PAID") return grandTotal;
  return currentReceivedAmount;
}

export function paymentReceivedLabel(paymentStatus: PaymentStatus): string {
  return paymentStatus === "DEPOSITED" ? "Tiền đã cọc" : "Đã nhận";
}

export function shouldPromptForPaymentAmount(paymentStatus: PaymentStatus, currentReceivedAmount: number, grandTotal: number): boolean {
  return paymentStatus === "DEPOSITED" && (currentReceivedAmount <= 0 || currentReceivedAmount >= grandTotal);
}

export function shouldShowPaymentQr(paymentStatus: PaymentStatus, remainingAmount: number): boolean {
  return paymentStatus !== "PAID" && remainingAmount > 0;
}

export function groupPaymentQueue(quotes: QuoteRecord[]): PaymentQueue {
  const queue: PaymentQueue = { unpaid: [], deposited: [], partial: [], paid: [] };
  for (const quote of quotes) {
    if (quote.status === "CANCELLED") continue;
    if (quote.paymentStatus === "UNPAID") queue.unpaid.push(quote);
    if (quote.paymentStatus === "DEPOSITED") queue.deposited.push(quote);
    if (quote.paymentStatus === "PARTIAL") queue.partial.push(quote);
    if (quote.paymentStatus === "PAID") queue.paid.push(quote);
  }
  return queue;
}

export function replaceQuoteInPaymentQueue(queue: PaymentQueue, quote: QuoteRecord): PaymentQueue {
  const current = Object.values(queue).flat().filter((item) => item.id !== quote.id);
  return groupPaymentQueue([quote, ...current]);
}
