import type { PaymentQueue, PaymentStatus, QuoteRecord } from "./types";

export function paymentActionAmount(
  paymentStatus: PaymentStatus,
  grandTotal: number,
  currentReceivedAmount: number,
): number {
  if (paymentStatus === "UNPAID") return 0;
  if (paymentStatus === "PAID") return grandTotal;
  return currentReceivedAmount;
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
