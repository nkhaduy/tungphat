export function supplierInquiryMessage(
  supplierName: string,
  code?: string,
): string {
  const normalizedSupplier = supplierName.trim();
  const normalizedCode = code?.trim();
  if (normalizedCode) {
    return `Tôi cần kiểm tra mã ${normalizedCode} của ${normalizedSupplier} tại Tùng Phát. Vui lòng tư vấn cốt ván, quy cách, tình trạng hàng và dịch vụ gia công phù hợp.`;
  }
  return `Tôi cần tư vấn catalogue ${normalizedSupplier} tại Tùng Phát.`;
}

export function buildSupplierZaloInquiryUrl(
  baseUrl: string,
  supplierName: string,
  code?: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("text", supplierInquiryMessage(supplierName, code));
  return url.toString();
}
