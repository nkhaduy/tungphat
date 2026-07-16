import { describe, expect, it } from "vitest";
import { onRequest as listMedia } from "@/functions/api/admin/media/index";
import { onRequest as uploadMedia } from "@/functions/api/admin/media/upload";
import { onRequest as deleteMedia } from "@/functions/api/admin/media/delete";

function object(key = "images/2026/07/photo.webp", type = "image/webp") {
  return {
    key,
    size: 120,
    etag: "etag-1",
    uploaded: new Date("2026-07-17T00:00:00Z"),
    httpMetadata: { contentType: type },
    customMetadata: { originalName: "Ảnh xưởng.webp" }
  } as unknown as R2Object;
}

function env(media: Partial<R2Bucket>) {
  return { MEDIA: media as R2Bucket, NEXT_PUBLIC_MEDIA_BASE_URL: "https://pub-example.r2.dev" } as CloudflareEnv;
}

function context(request: Request, media: Partial<R2Bucket>) {
  return { request, env: env(media) } as unknown as EventContext<CloudflareEnv, string, unknown>;
}

function adminHeaders(extra: Record<string, string> = {}) {
  return {
    "Cf-Access-Authenticated-User-Email": "admin@example.com",
    "Cf-Access-Jwt-Assertion": "signed-access-jwt",
    ...extra
  };
}

async function responseJson(response: Response) {
  return response.json() as Promise<{ ok: boolean; code?: string; cursor?: string; items?: unknown[] }>;
}

describe("admin media authorization", () => {
  it("rejects unauthorized uploads", async () => {
    const request = new Request("https://preview.example.com/api/admin/media/upload", { method: "POST" });
    const response = await uploadMedia(context(request, {}));
    expect(response.status).toBe(401);
  });

  it("rejects unauthorized deletes", async () => {
    const request = new Request("https://preview.example.com/api/admin/media/delete", { method: "DELETE" });
    const response = await deleteMedia(context(request, {}));
    expect(response.status).toBe(401);
  });
});

describe("media listing", () => {
  it("passes bounded pagination and returns a cursor", async () => {
    let options: R2ListOptions | undefined;
    const request = new Request("https://preview.example.com/api/admin/media?limit=20&prefix=images/&mime=image", { headers: adminHeaders() });
    const response = await listMedia(context(request, {
      list: async (value) => {
        options = value;
        return { objects: [object()], truncated: true, cursor: "next-cursor", delimitedPrefixes: [] };
      }
    }));
    expect(response.status).toBe(200);
    expect(options).toMatchObject({ limit: 20, prefix: "images/", include: ["httpMetadata", "customMetadata"] });
    const body = await responseJson(response);
    expect(body.cursor).toBe("next-cursor");
    expect(body.items).toHaveLength(1);
  });

  it("returns 503 when R2 is unavailable", async () => {
    const request = new Request("https://preview.example.com/api/admin/media", { headers: adminHeaders() });
    const response = await listMedia(context(request, { list: async () => { throw new Error("R2 unavailable"); } }));
    expect(response.status).toBe(503);
    expect((await responseJson(response)).code).toBe("storage_unavailable");
  });
});

describe("media upload validation and failure handling", () => {
  function uploadRequest(type: string, name: string, bytes: Uint8Array) {
    const csrf = "csrf-test-token";
    return new Request("https://preview.example.com/api/admin/media/upload", {
      method: "POST",
      headers: adminHeaders({
        Origin: "https://preview.example.com",
        Host: "preview.example.com",
        "Content-Type": type,
        "Content-Length": String(bytes.byteLength),
        "X-Media-Filename": encodeURIComponent(name),
        "X-CSRF-Token": csrf,
        Cookie: `tp_media_csrf=${csrf}`
      }),
      body: bytes
    });
  }

  it("blocks unsupported MIME types", async () => {
    const request = uploadRequest("text/html", "payload.html", new TextEncoder().encode("<html>"));
    const response = await uploadMedia(context(request, {}));
    expect(response.status).toBe(415);
  });

  it("blocks MIME signature spoofing", async () => {
    const request = uploadRequest("image/png", "payload.png", new TextEncoder().encode("<script>"));
    const response = await uploadMedia(context(request, {}));
    expect(response.status).toBe(415);
    expect((await responseJson(response)).code).toBe("mime_signature_mismatch");
  });

  it("returns 503 when an R2 upload fails", async () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const request = uploadRequest("image/png", "Ảnh xưởng.png", png);
    const response = await uploadMedia(context(request, {
      head: async () => null,
      put: async () => { throw new Error("write failed"); }
    }));
    expect(response.status).toBe(503);
    expect((await responseJson(response)).code).toBe("storage_unavailable");
  });
});
