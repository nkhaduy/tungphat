import type { Metadata } from "next";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter, ProductFrontmatter, ProjectFrontmatter, ServicePageFrontmatter } from "@/lib/content-schema";
import { resolveMediaUrl } from "@/lib/media";
import { getLocalSeoCopy } from "@/lib/local-seo";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { createSocialImage } from "@/lib/social-images";

type SeoEntry = ContentEntry<ArticleFrontmatter | ProductFrontmatter | ProjectFrontmatter | ServicePageFrontmatter>;

// Keep production search snippets stable while moving the static site host.
const liveSeoMigrationBaseline: Record<string, { title: string; description: string }> = {
  "/bai-viet/chuan-bi-file-cnc": {
    title: "Chuẩn bị file CNC gỗ và MDF để gửi xưởng | Tùng Phát",
    description: "Chuẩn bị file CNC gỗ và MDF với đơn vị đo, vật liệu, độ dày, kích thước, số lượng, đường cắt, lỗ/rãnh và mặt gia công.",
  },
  "/bai-viet/go-ghep-la-gi": {
    title: "Gỗ ghép là gì? Cách nhìn tấm và chọn theo hạng mục | Tùng Phát",
    description: "Giải thích gỗ ghép là gì, cách nhìn hướng thanh, mối ghép, bề mặt và cạnh; gợi ý chọn cao su, tràm theo hạng mục và yêu cầu CNC.",
  },
  "/bai-viet/mdf-thuong-va-chong-am": {
    title: "MDF thường hay chống ẩm? Chọn theo môi trường | Tùng Phát",
    description: "So sánh MDF thường và MDF chống ẩm theo môi trường, hạng mục, cốt ván, bề mặt và cạnh; nhấn mạnh chống ẩm không đồng nghĩa chống nước.",
  },
};

export function resolveContentMetadataCopy(
  entry: Pick<SeoEntry, "seoTitle" | "seoDescription">,
  path: string,
) {
  const normalizedPath = path.replace(/\/$/u, "");
  return liveSeoMigrationBaseline[normalizedPath] ?? {
    title: entry.seoTitle,
    description: entry.seoDescription,
  };
}

export function createContentMetadata(entry: SeoEntry, path: string): Metadata {
  const localCopy = getLocalSeoCopy(entry.slug);
  const contentCopy = resolveContentMetadataCopy(entry, path);
  const image = resolveMediaUrl(entry.ogImage || entry.featuredImage);
  const metadata = entry.ogImage ? entry.mediaMetadata?.ogImage : entry.mediaMetadata?.featuredImage;
  const socialImage = createSocialImage({ url: image, alt: entry.featuredImageAlt, width: metadata?.width, height: metadata?.height, type: metadata?.type });
  const base = createPageMetadata({
    title: localCopy?.title ?? contentCopy.title,
    description: localCopy?.description ?? contentCopy.description,
    path,
    noIndex: entry.noindex || entry.draft,
    socialImages: [socialImage],
  });
  return {
    ...base,
    alternates: { canonical: entry.canonical || absoluteUrl(path) },
  };
}
