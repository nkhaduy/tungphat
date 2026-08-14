import type { BankSettings } from "./types";

export function buildVietQrUrl(bank: BankSettings, amount: number | null): string | null {
  if (amount !== null && (!Number.isSafeInteger(amount) || amount < 0)) throw new Error("Số tiền VietQR không hợp lệ.");
  if (amount === 0) return null;
  const params = new URLSearchParams({
    acc: bank.accountNumber,
    bank: bank.bankCode,
    template: "compact",
    showinfo: "true",
    fullacc: "true",
    holder: bank.holder,
    store: bank.store,
  });
  if (amount !== null) params.set("amount", String(amount));
  return `https://vietqr.app/img?${params.toString()}`;
}
