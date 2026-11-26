import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Static export cannot vary the initial meta robots tag by query string.
      // Let crawlers render catalogue filter URLs so the client can apply noindex after hydration.
      allow: [
        "/",
        "/catalogue/*?q=",
        "/catalogue/*?query=",
        "/catalogue/*?supplier=",
        "/catalogue/*?material=",
        "/catalogue/*?pattern=",
        "/catalogue/*?surface=",
        "/catalogue/*?sort=",
        "/catalogue/*?type=",
        "/catalogue/*?group=",
        "/catalogue/*?category=",
      ],
      disallow: [
        "/api/",
        "/admin/",
        "/_vercel/",
        "/preview/",
        "/cms-preview/",
        "/*?preview=",
        "/*?search=",
        "/*?filter=",
        "/*?q=",
        "/*?query=",
        "/*?category=",
        "/*?sort=",
        "/*?supplier=",
        "/*?material=",
        "/*?pattern=",
        "/*?surface=",
      ]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
