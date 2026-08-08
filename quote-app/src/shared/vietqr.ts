import type { BankSettings } from "./types";

export function buildVietQrUrl(bank: BankSettings, amount: number): string | null {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Số tiền VietQR không hợp lệ.");
  if (amount === 0) return null;
  const params = new URLSearchParams({
    acc: bank.accountNumber,
    bank: bank.bankCode,
    amount: String(amount),
    template: "compact",
    showinfo: "true",
    fullacc: "true",
    holder: bank.holder,
    store: bank.store,
  });
  return `https://vietqr.app/img?${params.toString()}`;
}
