import { validateDeletionBatch, type DeleteExpectation } from "./r2-delete";

type InventoryObject = {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  httpMetadata?: Record<string, unknown>;
  customMetadata?: Record<string, string>;
};

interface InventoryBucket {
  list(options: { cursor?: string; limit: number; include: string[] }): Promise<{ truncated: boolean; cursor?: string; objects: InventoryObject[] }>;
  head(key: string): Promise<InventoryObject | null>;
  delete(keys: string[]): Promise<void>;
}

interface Env {
  R2: InventoryBucket;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/delete" && request.method === "POST") {
      const expected = await request.json() as DeleteExpectation[];
      if (!Array.isArray(expected) || expected.length < 1 || expected.length > 100) {
        return Response.json({ error: "Delete batch must contain 1-100 objects" }, { status: 400 });
      }
      const actual = await Promise.all(expected.map(async (object) => {
        const current = await env.R2.head(object.key);
        return current ? { key: current.key, etag: current.etag, size: current.size } : undefined;
      }));
      try {
        validateDeletionBatch(expected, actual.filter((object): object is DeleteExpectation => Boolean(object)));
      } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 409 });
      }
      await env.R2.delete(expected.map((object) => object.key));
      return Response.json({ deleted: expected.length });
    }
    if (url.pathname !== "/inventory") return new Response("Not found", { status: 404 });
    const cursor = url.searchParams.get("cursor") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") || 1000), 1000);
    const page = await env.R2.list({ cursor, limit, include: ["httpMetadata", "customMetadata"] });
    return Response.json({
      truncated: page.truncated,
      cursor: page.truncated ? page.cursor : undefined,
      objects: page.objects.map((object) => ({
        key: object.key,
        size: object.size,
        etag: object.etag,
        uploaded: object.uploaded.toISOString(),
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata,
      })),
    });
  },
};

export default worker;
