export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof allowedImageTypes)[number];

export function isAllowedImageType(value: string): value is AllowedImageType {
  return allowedImageTypes.includes(value as AllowedImageType);
}

export function matchesMagicBytes(mimeType: AllowedImageType, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
}
