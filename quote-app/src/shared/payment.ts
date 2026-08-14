import type { PaymentQueue, QuoteRecord } from "./types";

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
