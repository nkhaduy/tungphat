import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/_vercel/", "/preview/", "/cms-preview/", "/*?preview="]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
