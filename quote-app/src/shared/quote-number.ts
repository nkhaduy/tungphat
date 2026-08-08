export function vietnamDateParts(date: Date): { isoDate: string; compact: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return { isoDate: `${year}-${month}-${day}`, compact: `${day}${month}${year.slice(-2)}` };
}

export function formatQuoteNumber(branchCode: string, compactDate: string, sequence: number): string {
  if (!/^[A-Z0-9]{2,12}$/.test(branchCode)) throw new Error("Mã chi nhánh không hợp lệ.");
  if (!/^\d{6}$/.test(compactDate)) throw new Error("Ngày tạo mã báo giá không hợp lệ.");
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 999_999) throw new Error("Số thứ tự báo giá không hợp lệ.");
  return `${branchCode}-${compactDate}-${String(sequence).padStart(3, "0")}`;
}
