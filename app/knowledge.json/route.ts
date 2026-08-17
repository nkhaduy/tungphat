import { buildKnowledgeIndex } from "@/lib/knowledge";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(await buildKnowledgeIndex(), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
