import { HttpError } from "./http";

export type RasterImageInfo = { contentType: "image/png" | "image/jpeg"; width: number; height: number };

function uint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > bytes.length) return null;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) return null;
    if (startOfFrame.has(marker)) {
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += length;
  }
  return null;
}

export function validateRasterImage(
  buffer: ArrayBuffer,
  declaredType?: string | null,
  limits: { maxWidth?: number; maxHeight?: number; maxPixels?: number } = {},
): RasterImageInfo {
  const bytes = new Uint8Array(buffer);
  let info: RasterImageInfo | null = null;
  const png = bytes.length >= 24 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (png && String.fromCharCode(...bytes.slice(12, 16)) === "IHDR") {
    info = { contentType: "image/png", width: uint32(bytes, 16), height: uint32(bytes, 20) };
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) {
    const dimensions = jpegDimensions(bytes);
    if (dimensions) info = { contentType: "image/jpeg", ...dimensions };
  }
  if (!info) throw new HttpError(422, "File ảnh không phải PNG hoặc JPEG hợp lệ.");
  const normalizedDeclared = declaredType?.split(";", 1)[0].trim().toLowerCase();
  if (normalizedDeclared && normalizedDeclared !== info.contentType) throw new HttpError(422, "Định dạng thực tế của file ảnh không khớp MIME.");
  const maxWidth = limits.maxWidth ?? 6_000;
  const maxHeight = limits.maxHeight ?? 6_000;
  const maxPixels = limits.maxPixels ?? 20_000_000;
  if (info.width < 1 || info.height < 1 || info.width > maxWidth || info.height > maxHeight || info.width * info.height > maxPixels) {
    throw new HttpError(422, "Kích thước ảnh vượt quá giới hạn an toàn.");
  }
  return info;
}
