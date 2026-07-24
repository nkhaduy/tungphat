import { mediaUrl, type MediaReference } from "@/lib/media";

export type SocialImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  type: string;
};

export type SocialImageInput = {
  url: MediaReference;
  width?: number;
  height?: number;
  alt: string;
  type?: string;
};

const LOCAL_SOCIAL_IMAGE_ASSETS: Record<
  string,
  Pick<SocialImage, "width" | "height" | "type">
> = {
  "/og-logo.png": { width: 1200, height: 630, type: "image/png" },
  "/images/cnc-service.webp": { width: 1222, height: 821, type: "image/webp" },
  "/images/hero-workshop4.webp": { width: 1915, height: 821, type: "image/webp" },
  "/images/hero-workshop5.webp": { width: 1915, height: 821, type: "image/webp" },
  "/images/wood-panels.webp": { width: 1448, height: 1086, type: "image/webp" },
  "/wood/mdfmfc.webp": { width: 1122, height: 1402, type: "image/webp" },
  "/wood/vanchongam.webp": { width: 1122, height: 1402, type: "image/webp" },
};

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function positiveInteger(value: number | undefined, field: "width" | "height") {
  if (!Number.isInteger(value) || (value ?? 0) <= 0) {
    throw new Error(`Social image ${field} must be a positive integer.`);
  }
  return value as number;
}

function expectedMimeType(pathname: string) {
  const extension = pathname.match(/\.[a-z0-9]+$/iu)?.[0]?.toLowerCase();
  return extension ? MIME_BY_EXTENSION[extension] : undefined;
}

export function createSocialImage(input: SocialImageInput): SocialImage {
  const url = mediaUrl(input.url);
  const alt = input.alt.trim();
  if (!alt) throw new Error("Social image alt must not be empty.");

  const parsed = new URL(url, "https://local-social-image.invalid");
  const localAsset = url.startsWith("/")
    ? LOCAL_SOCIAL_IMAGE_ASSETS[parsed.pathname]
    : undefined;
  const width = positiveInteger(input.width ?? localAsset?.width, "width");
  const height = positiveInteger(input.height ?? localAsset?.height, "height");
  const type = (input.type ?? localAsset?.type ?? "").trim().toLowerCase();

  if (!type.startsWith("image/")) {
    throw new Error("Social image type must be an image MIME type.");
  }
  if (localAsset && (width !== localAsset.width || height !== localAsset.height || type !== localAsset.type)) {
    throw new Error(`Social image metadata does not match the registered asset: ${parsed.pathname}`);
  }

  const expectedType = expectedMimeType(parsed.pathname);
  if (expectedType && type !== expectedType) {
    throw new Error(`Social image MIME type does not match its file extension: ${url}`);
  }

  return { url, width, height, alt, type };
}

export function createSocialImages(inputs: SocialImageInput[]) {
  if (!inputs.length) throw new Error("At least one social image is required.");
  return inputs.map(createSocialImage);
}

export function twitterSocialImage(image: SocialImage) {
  return { url: image.url, alt: image.alt };
}
