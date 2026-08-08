import fs from "node:fs";
import path from "node:path";
import { publicSnapshotSchema } from "../src/contracts/content";
import { applySsoSession, readSsoSession, type SsoSessionInput } from "./sso-session-input";

const baseUrl = process.env.LIGHT_CMS_STAGING_URL || "https://cms.mdftungphat.com";
const adminSession = readSsoSession(process.env);

type Result = { name: string; status: number; ok: boolean };
const results: Result[] = [];

class Client {
  csrf = "";
  constructor(private readonly session?: SsoSessionInput) {}

  async call<T>(name: string, url: string, init: RequestInit = {}, expected: number | number[] = 200) {
    const method = (init.method || "GET").toUpperCase();
    const headers = new Headers(init.headers);
    if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
    if (this.session) applySsoSession(headers, this.session);
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      headers.set("Origin", baseUrl);
      if (this.csrf) headers.set("X-CSRF-Token", this.csrf);
    }
    const response = await fetch(`${baseUrl}${url}`, { ...init, headers, redirect: "manual" });
    const allowed = Array.isArray(expected) ? expected : [expected];
    results.push({ name, status: response.status, ok: allowed.includes(response.status) });
    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!allowed.includes(response.status)) throw new Error(`${name}: expected ${allowed.join("/")}, received ${response.status}: ${text.slice(0, 300)}`);
    return data as T;
  }

  async initialize() {
    const response = await this.call<{ ok: true; data: { csrf: string; user: { id: string; name: string; role: string } } }>("Baogia SSO session", "/api/auth/session");
    this.csrf = response.data.csrf;
    return response.data.user;
  }
}

const admin = new Client(adminSession);
const fixtureSlug = `acceptance-${Date.now()}`;
let contentId = "";
let contentVersion = 0;
let mediaId = "";

try {
  await new Client().call("missing CMS session", "/api/dashboard", {}, 401);
  const adminUser = await admin.initialize();
  if (adminUser.role !== "super-admin") throw new Error(`Unexpected CMS role: ${adminUser.role}`);

  const forgedResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      Cookie: adminSession.cookie,
      "Cf-Access-Jwt-Assertion": "forged.jwt.value",
      "Cf-Access-Authenticated-User-Email": "forged@example.com",
      "X-Baogia-User": "forged-user",
    },
    redirect: "manual",
  });
  const forgedBody = await forgedResponse.json() as { data?: { user?: { id?: string } } };
  const forgedOk = forgedResponse.status === 200 && forgedBody.data?.user?.id === adminUser.id;
  results.push({ name: "forged identity headers stripped", status: forgedResponse.status, ok: forgedOk });
  if (!forgedOk) throw new Error("Forged identity headers changed the verified CMS identity");

  const dashboard = await admin.call<{ ok: true; data: { counts: Record<string, number> } }>("dashboard", "/api/dashboard");
  if ((dashboard.data.counts.products || 0) < 1) throw new Error("Staging has no source product for acceptance");
  const list = await admin.call<{ ok: true; data: { items: Array<{ id: string }> } }>("product list", "/api/products");
  const source = await admin.call<{ ok: true; data: { content_json: string; version: number } }>("product detail", `/api/products/${list.data.items[0].id}`);
  const product = JSON.parse(source.data.content_json) as Record<string, unknown>;
  product.slug = fixtureSlug;
  product.title = "Ván MDF acceptance staging";
  product.canonical = `https://mdftungphat.com/${fixtureSlug}`;

  const created = await admin.call<{ ok: true; data: { id: string; version: number } }>("content create", "/api/products", { method: "POST", body: JSON.stringify(product) }, 201);
  contentId = created.data.id;
  contentVersion = created.data.version;
  const draft = await admin.call<{ ok: true; data: { version: number } }>("draft save", `/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: product, expectedVersion: contentVersion, status: "draft" }) });
  contentVersion = draft.data.version;
  const published = await admin.call<{ ok: true; data: { version: number } }>("publish", `/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: product, expectedVersion: contentVersion, status: "published" }) });
  contentVersion = published.data.version;
  const unpublished = await admin.call<{ ok: true; data: { version: number } }>("unpublish", `/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: product, expectedVersion: contentVersion, status: "draft" }) });
  contentVersion = unpublished.data.version;
  const versions = await admin.call<{ ok: true; data: { results: Array<{ version: number }> } }>("version list", `/api/versions/${contentId}`);
  const restoreSource = versions.data.results.at(-1)?.version || 1;
  const restored = await admin.call<{ ok: true; data: { version: number } }>("restore", `/api/versions/${contentId}/restore`, { method: "POST", body: JSON.stringify({ version: restoreSource, expectedVersion: contentVersion }) });
  contentVersion = restored.data.version;
  const preview = await admin.call<{ ok: true; data: { token: string } }>("preview token", `/api/preview/${contentId}`, { method: "POST", body: "{}" });
  await admin.call("preview read", `/api/preview/${contentId}?token=${encodeURIComponent(preview.data.token)}`);

  await admin.call("users are read-only", "/api/users", { method: "POST", body: "{}" }, 405);
  const users = await admin.call<{ ok: true; data: Array<{ id: string; baogia_username: string }> }>("user list", "/api/users");
  if (!users.data.some((user) => user.id === adminUser.id)) throw new Error("Authenticated Baogia shadow identity is absent from the user list");
  await admin.call("audit", "/api/audit");

  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
  const media = await admin.call<{ ok: true; data: { id: string; uploadUrl: string } }>("media metadata", "/api/media", { method: "POST", body: JSON.stringify({ filename: `${fixtureSlug}.png`, mimeType: "image/png", size: png.byteLength, alt: "Ảnh fixture acceptance staging" }) }, 201);
  mediaId = media.data.id;
  await admin.call("media upload", media.data.uploadUrl, { method: "PUT", body: png, headers: { "Content-Type": "image/png", "Content-Length": String(png.byteLength) } });
  await admin.call("media delete", `/api/media/${mediaId}`, { method: "DELETE", body: "{}" });
  mediaId = "";

  await admin.call("content delete", `/api/products/${contentId}`, { method: "DELETE", body: JSON.stringify({ expectedVersion: contentVersion }) });
  contentId = "";
  const snapshotResponse = await admin.call<{ ok: true; data: unknown }>("public snapshot", "/api/public/snapshot");
  publicSnapshotSchema.parse(snapshotResponse.data);

  await admin.call("CMS logout", "/api/auth/logout", { method: "POST", body: "{}" });
  await admin.call("revoked session", "/api/auth/session", {}, 401);
} finally {
  if (mediaId) await admin.call("cleanup media", `/api/media/${mediaId}`, { method: "DELETE", body: "{}" }, [200, 404, 401]).catch(() => undefined);
  if (contentId) await admin.call("cleanup content", `/api/products/${contentId}`, { method: "DELETE", body: JSON.stringify({ expectedVersion: contentVersion }) }, [200, 404, 409, 401]).catch(() => undefined);
}

const failed = results.filter((result) => !result.ok);
const report = { generatedAt: new Date().toISOString(), baseUrl, auth: "baogia-sso", requests: results.length, failed: failed.length, results };
const output = path.resolve(import.meta.dirname, "../output/acceptance");
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "remote-e2e.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ requests: results.length, failed: failed.length }, null, 2));
if (failed.length) process.exitCode = 1;
