export function numericInputError(kind: "money" | "quantity" | "percent", value: string): string {
  if (/[-−]/u.test(value)) return "Không được nhập số âm.";
  if (kind === "money") {
    if (!/^[\d.,\s₫đĐ]*$/u.test(value)) return "Số tiền không hợp lệ.";
    const digits = value.replace(/\D/g, "");
    if (digits && !Number.isSafeInteger(Number(digits))) return "Số tiền vượt quá giới hạn cho phép.";
    return "";
  }
  const compact = value.trim().replace(/\s/g, "");
  if (kind === "percent") {
    if (!/^\d*(?:[.,]\d*)?$/u.test(compact)) return "Chiết khấu không hợp lệ.";
    const normalized = compact.replace(",", ".");
    const separator = normalized.indexOf(".");
    if (separator >= 0 && normalized.slice(separator + 1).length > 2) return "Chiết khấu chỉ được có tối đa 2 chữ số thập phân.";
    if (Number(normalized) > 100) return "Chiết khấu phải từ 0 đến 100%.";
    return "";
  }
  if (!/^\d*(?:[.,]\d*)?$/u.test(compact)) return "Số lượng không hợp lệ.";
  const normalized = compact.replace(",", ".");
  const separator = normalized.indexOf(".");
  if (separator >= 0 && normalized.slice(separator + 1).replace(/\./g, "").length > 3) {
    return "Số lượng chỉ được có tối đa 3 chữ số thập phân.";
  }
  if (Number(normalized) > 1_000_000_000) return "Số lượng vượt quá giới hạn cho phép.";
  return "";
}

export function parseDiscountPercentInput(value: string): number {
  const compact = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!compact || compact === ".") return 0;
  const parsed = Number(compact);
  return Number.isFinite(parsed) ? parsed : 0;
}
