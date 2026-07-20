import { describe, expect, it } from "vitest";
import { handleMedia } from "../src/media/handler";

const payload = new TextEncoder().encode("test-video");
const uploaded = new Date("2026-07-20T00:00:00.000Z");

function object(body = payload): R2ObjectBody {
  return {
    key: "videos/legacy/0619.mp4",
    version: "v1",
    size: payload.byteLength,
    etag: "etag-value",
    httpEtag: '"etag-value"',
    checksums: {},
    uploaded,
    httpMetadata: { contentType: "video/mp4", cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: {},
    range: { offset: 0, length: body.byteLength },
    storageClass: "Standard",
    ssecKeyMd5: undefined,
    writeHttpMetadata(headers) {
      headers.set("Content-Type", "video/mp4");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      }
    }),
    bodyUsed: false,
    arrayBuffer: async () => body.buffer,
    bytes: async () => body,
    text: async () => new TextDecoder().decode(body),
    json: async () => JSON.parse(new TextDecoder().decode(body)),
    blob: async () => new Blob([body], { type: "video/mp4" })
  } as R2ObjectBody;
}

function metadata(): R2Object {
  return object() as unknown as R2Object;
}

function env(overrides: Partial<R2Bucket> = {}) {
  const bucket = {
    head: async () => metadata(),
    get: async (_key: string, options?: R2GetOptions) => {
      const range = options?.range as { offset?: number; length?: number } | undefined;
      const start = range?.offset ?? 0;
      const end = start + (range?.length ?? payload.byteLength);
      return object(payload.slice(start, end));
    },
    ...overrides
  } as R2Bucket;
  return { MEDIA: bucket } as CloudflareCmsEnv;
}

describe("private R2 media delivery", () => {
  it("streams the full video with immutable metadata", async () => {
    const response = await handleMedia(
      new Request("https://cms.mdftungphat.com/media/videos/legacy/0619.mp4"),
      env()
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("video/mp4");
    expect(response.headers.get("Content-Length")).toBe(String(payload.byteLength));
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(await response.text()).toBe("test-video");
  });

  it("supports open-ended byte ranges used by browsers", async () => {
    const response = await handleMedia(
      new Request("https://cms.mdftungphat.com/media/videos/legacy/0619.mp4", {
        headers: { Range: "bytes=0-" }
      }),
      env()
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe(`bytes 0-${payload.byteLength - 1}/${payload.byteLength}`);
    expect(response.headers.get("Content-Length")).toBe(String(payload.byteLength));
  });

  it("returns 416 for an unsatisfiable range", async () => {
    const response = await handleMedia(
      new Request("https://cms.mdftungphat.com/media/videos/legacy/0619.mp4", {
        headers: { Range: "bytes=999-" }
      }),
      env()
    );

    expect(response.status).toBe(416);
    expect(response.headers.get("Content-Range")).toBe(`bytes */${payload.byteLength}`);
  });

  it("does not expose keys outside the public videos prefix", async () => {
    let storageRead = false;
    const response = await handleMedia(
      new Request("https://cms.mdftungphat.com/media/private/customer.pdf"),
      env({ head: async () => {
        storageRead = true;
        return null;
      } })
    );

    expect(response.status).toBe(404);
    expect(storageRead).toBe(false);
  });
});
