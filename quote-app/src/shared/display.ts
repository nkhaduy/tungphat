export function formatEmployeeContact(name: string, phone: string): string {
  const normalizedName = name.trim();
  const normalizedPhone = phone.trim();
  return normalizedPhone ? `${normalizedName} - ${normalizedPhone}` : normalizedName;
}

export function shouldShowSpecificationColumn(items: Array<{ specification: string }>): boolean {
  return items.some((item) => item.specification.trim().length > 0);
}

type QuotePdfNameSource = {
  customerName: string;
  quoteDate: string;
  quoteNumber: string;
};

function safeFilenamePart(value: string, fallback: string): string {
  const withoutControls = Array.from(value, (character) => character.charCodeAt(0) < 32 ? " " : character).join("");
  const sanitized = withoutControls.replace(/[<>:"/\\|?*]/g, " ").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "");
  return sanitized || fallback;
}

export function buildQuotePdfFilename(quote: QuotePdfNameSource): string {
  const dateParts = quote.quoteDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const compactDate = dateParts ? `${dateParts[3]}${dateParts[2]}${dateParts[1].slice(-2)}` : "000000";
  const sequence = quote.quoteNumber.match(/-(\d+)$/)?.[1] ?? "000";
  const customerName = safeFilenamePart(quote.customerName, "Khach_hang");
  return `${customerName}_BaoGia_TungPhat_${compactDate}_${sequence}.pdf`;
}

export function buildQuotePdfContentDisposition(quote: QuotePdfNameSource): string {
  const filename = buildQuotePdfFilename(quote);
  const asciiFilename = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Đđ]/g, (character) => character === "Đ" ? "D" : "d").replace(/[^\x20-\x7e]/g, "");
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
