import sitemap from "@/app/sitemap";
import business from "@/content/settings/business.json";
import { buildKnowledgeIndex } from "@/lib/knowledge";
import { generateLlmsIndex } from "@/lib/llms-index";

export const dynamic = "force-static";

export async function GET() {
  const [entries, knowledge] = await Promise.all([sitemap(), buildKnowledgeIndex()]);
  const { markdown } = generateLlmsIndex({
    sitemapUrls: entries.map((entry) => entry.url),
    pages: knowledge.pages,
    businessName: business.businessName,
    phone: business.phoneDisplay,
    zaloUrl: business.zaloUrl,
    serviceAreas: business.serviceAreas,
  });

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
