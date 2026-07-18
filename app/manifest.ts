import type { MetadataRoute } from "next";
import seo from "@/content/settings/seo.json";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: seo.defaultTitle,
    short_name: seo.siteName,
    description: seo.defaultDescription,
    lang: "vi",
    start_url: "/",
    display: "standalone",
    background_color: "#062b1d",
    theme_color: "#062b1d",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
