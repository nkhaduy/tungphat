import type { SupplierMediaType } from "./types";

type ClassificationInput = {
  url: string;
  alt?: string;
  title?: string;
  section?: string;
  associatedWithProduct: boolean;
};

export type MediaClassification =
  | { accepted: true; type: SupplierMediaType }
  | { accepted: false; reason: string };

function searchable(input: ClassificationInput): string {
  return [input.url, input.alt, input.title, input.section].filter(Boolean).join(" ").toLowerCase();
}

export function classifySupplierMedia(input: ClassificationInput): MediaClassification {
  const value = searchable(input);
  if (!input.associatedWithProduct) return { accepted: false, reason: "unassociated" };
  if (/(?:no[-_ ]?image|placeholder|coming[-_ ]?soon|\bsoon\b)/i.test(value)) {
    return { accepted: false, reason: "placeholder" };
  }
  if (/(?:catalog(?:ue)?[-_ ]?cover|cover[-_ ]?catalog|collection[-_ ]?cover)/i.test(value)) {
    return { accepted: false, reason: "catalogue-cover" };
  }
  if (/(?:\blogo\b|\bbanner\b|\bhero\b|decorative[-_ ]?background)/i.test(value)) {
    return { accepted: false, reason: "marketing-or-decoration" };
  }
  if (/(?:room|kitchen|bedroom|living[-_ ]?room|không gian|phòng|nội thất)/i.test(value)) {
    return { accepted: true, type: "room" };
  }
  if (/(?:application|ứng dụng|project|công trình|lifestyle)/i.test(value)) {
    return { accepted: true, type: "application" };
  }
  if (/(?:texture|surface|bề mặt)/i.test(value)) return { accepted: true, type: "texture" };
  if (/(?:swatch|mẫu màu|color[-_ ]?chip)/i.test(value)) return { accepted: true, type: "swatch" };
  if (/(?:close[-_ ]?up|detail|cận cảnh|thực tế)/i.test(value)) return { accepted: true, type: "detail" };
  if (/(?:edge|cạnh|cốt ván|core)/i.test(value)) return { accepted: true, type: "edge" };
  if (/(?:board|full[-_ ]?sheet|tấm ván|panel)/i.test(value)) return { accepted: true, type: "board" };
  return { accepted: true, type: "other" };
}

