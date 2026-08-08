import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/worker/index";
import { fixedLengthStream } from "../src/worker/media/stream";
import { createSession } from "../src/worker/security/session";
import { createSqliteD1 } from "./helpers/sqlite-d1";

afterEach(() => vi.unstubAllGlobals());

describe("streamed media uploads", () => {
  it("uses Workers FixedLengthStream when the runtime provides it", () => {
    const calls: number[] = [];
    vi.stubGlobal("FixedLengthStream", class {
      readable = new ReadableStream<Uint8Array>();
      writable = new WritableStream<Uint8Array>();
      constructor(expected: number) { calls.push(expected); }
    });
    const stream = fixedLengthStream(16);
    expect(calls).toEqual([16]);
    expect(stream.readable).toBeInstanceOf(ReadableStream);
  });

  it("accepts a browser upload when Content-Length is omitted", async () => {
    const { db, sqlite } = createSqliteD1();
    const now = new Date().toISOString();
    sqlite.prepare(`INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,baogia_subject,baogia_username,failed_attempts,created_at,updated_at)
      VALUES('media-admin','admin@example.com','Media admin','Media admin','admin','!baogia-sso!',1,'active','media-subject','admin',0,?,?)`).run(now, now);
    const objects = new Map<string, Uint8Array>();
    const media = {
      put: async (key: string, body: ReadableStream<Uint8Array>) => {
        objects.set(key, new Uint8Array(await new Response(body).arrayBuffer()));
        return { httpEtag: "etag" };
      },
      head: async (key: string) => objects.has(key) ? { size: objects.get(key)?.byteLength || 0 } : null,
      get: async () => null,
      delete: async () => undefined,
    } as unknown as R2Bucket;
    const secret = "s".repeat(32);
    const env = {
      DB: db,
      MEDIA: media,
      APP_SECRET: "a".repeat(32),
      SESSION_SECRET: secret,
      BAOGIA_SSO_ISSUER: "https://baogia.mdftungphat.com",
      BAOGIA_SSO_AUD: "tungphat-light-cms",
      BAOGIA_SSO_PUBLIC_JWK: "{}",
      BAOGIA_SSO_KEY_ID: "baogia-cms-2026-08",
      ALLOWED_ORIGINS: "https://staging.example",
      SERVICE_NAME: "media-test",
    } as never;
    const created = await createSession({ DB: db, SESSION_SECRET: secret, COOKIE_SECURE: true }, { id: "media-admin", email: "admin@example.com", role: "admin" });
    const cookie = created.cookie.split(";")[0];
    const call = (path: string, init: RequestInit = {}) => worker.fetch(new Request(`https://staging.example${path}`, { ...init, headers: new Headers({ ...Object.fromEntries(new Headers(init.headers).entries()), Cookie: cookie }) }), env);
    const session = await call("/api/auth/session");
    const csrf = ((await session.json()) as { data: { csrf: string } }).data.csrf;
    const metadata = await call("/api/media", { method: "POST", headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf, "Content-Type": "application/json" }, body: JSON.stringify({ filename: "fixture.png", mimeType: "image/png", size: 16, alt: "Fixture image" }) });
    const uploadUrl = ((await metadata.json()) as { data: { uploadUrl: string } }).data.uploadUrl;
    const upload = await call(uploadUrl, { method: "PUT", headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf, "Content-Type": "image/png" }, body: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]) });
    expect(upload.status).toBe(200);
  });

  it("rejects a streamed body whose size differs from metadata and leaves no R2 object", async () => {
    const { db, sqlite } = createSqliteD1();
    const now = new Date().toISOString();
    sqlite.prepare(`INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,baogia_subject,baogia_username,failed_attempts,created_at,updated_at)
      VALUES('media-admin-2','admin2@example.com','Media admin','Media admin','admin','!baogia-sso!',1,'active','media-subject-2','admin2',0,?,?)`).run(now, now);
    const objects = new Map<string, Uint8Array>();
    const media = {
      put: async (key: string, body: ReadableStream<Uint8Array>) => {
        objects.set(key, new Uint8Array(await new Response(body).arrayBuffer()));
        return { httpEtag: "etag" };
      },
      head: async (key: string) => objects.has(key) ? { size: objects.get(key)?.byteLength || 0 } : null,
      get: async () => null,
      delete: async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key); },
    } as unknown as R2Bucket;
    const secret = "s".repeat(32);
    const env = { DB: db, MEDIA: media, APP_SECRET: "a".repeat(32), SESSION_SECRET: secret, BAOGIA_SSO_ISSUER: "https://baogia.mdftungphat.com", BAOGIA_SSO_AUD: "tungphat-light-cms", BAOGIA_SSO_PUBLIC_JWK: "{}", BAOGIA_SSO_KEY_ID: "baogia-cms-2026-08", ALLOWED_ORIGINS: "https://staging.example" } as never;
    const created = await createSession({ DB: db, SESSION_SECRET: secret, COOKIE_SECURE: true }, { id: "media-admin-2", email: "admin2@example.com", role: "admin" });
    const cookie = created.cookie.split(";")[0];
    const call = (path: string, init: RequestInit = {}) => worker.fetch(new Request(`https://staging.example${path}`, { ...init, headers: new Headers({ ...Object.fromEntries(new Headers(init.headers).entries()), Cookie: cookie }) }), env);
    const session = await call("/api/auth/session");
    const csrf = ((await session.json()) as { data: { csrf: string } }).data.csrf;
    const metadata = await call("/api/media", { method: "POST", headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf, "Content-Type": "application/json" }, body: JSON.stringify({ filename: "fixture.png", mimeType: "image/png", size: 16, alt: "Fixture image" }) });
    const uploadUrl = ((await metadata.json()) as { data: { uploadUrl: string } }).data.uploadUrl;
    const upload = await call(uploadUrl, { method: "PUT", headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf, "Content-Type": "image/png" }, body: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00]) });
    expect(upload.status).toBe(422);
    expect(objects.size).toBe(0);
  });
});
