import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const indexableRoutes = [
  "/",
  "/san-pham",
  "/gia-cong-cnc",
  "/lien-he",
  "/chinh-sach-bao-mat",
  "/dieu-khoan-su-dung"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes.map((path) => ({ url: absoluteUrl(path) }));
}
