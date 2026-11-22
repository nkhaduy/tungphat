export function numericInputError(kind: "money" | "quantity", value: string): string {
  if (/[-−]/u.test(value)) return "Không được nhập số âm.";
  if (kind === "money") {
    if (!/^[\d.,\s₫đĐ]*$/u.test(value)) return "Số tiền không hợp lệ.";
    const digits = value.replace(/\D/g, "");
    if (digits && !Number.isSafeInteger(Number(digits))) return "Số tiền vượt quá giới hạn cho phép.";
    return "";
  }
  const compact = value.trim().replace(/\s/g, "");
  if (!/^\d*(?:[.,]\d*)?$/u.test(compact)) return "Số lượng không hợp lệ.";
  const normalized = compact.replace(",", ".");
  const separator = normalized.indexOf(".");
  if (separator >= 0 && normalized.slice(separator + 1).replace(/\./g, "").length > 3) {
    return "Số lượng chỉ được có tối đa 3 chữ số thập phân.";
  }
  if (Number(normalized) > 1_000_000_000) return "Số lượng vượt quá giới hạn cho phép.";
  return "";
}
