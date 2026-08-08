import fs from "node:fs";
import path from "node:path";
import { publicSnapshotSchema } from "../src/contracts/content";
import { applyAccessSession, readAccessSession, type AccessSessionInput } from "./access-session-input";

const baseUrl = process.env.LIGHT_CMS_STAGING_URL || "https://tungphat-light-cms-20260805-0855-staging.pages.dev";
const adminSession = readAccessSession(process.env, "ADMIN");
const editorSession = readAccessSession(process.env, "EDITOR");
const editorEmail = (process.env.LIGHT_CMS_EDITOR_EMAIL || "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(editorEmail)) throw new Error("LIGHT_CMS_EDITOR_EMAIL must match the pre-approved editor Access identity");

type Result = { name: string; status: number; ok: boolean };
const results: Result[] = [];

class Client {
  csrf = "";
  constructor(private readonly access?: AccessSessionInput) {}
  async call<T>(name: string, url: string, init: RequestInit = {}, expected: number | number[] = 200) {
    const method = (init.method || "GET").toUpperCase(); const headers = new Headers(init.headers);
    if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
    if (this.access) applyAccessSession(headers, this.access);
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) { headers.set("Origin", baseUrl); if (this.csrf) headers.set("X-CSRF-Token", this.csrf); }
    const response = await fetch(`${baseUrl}${url}`, { ...init, headers, redirect: "manual" });
    const allowed = Array.isArray(expected) ? expected : [expected]; results.push({ name, status: response.status, ok: allowed.includes(response.status) });
    const text = await response.text(); let data: unknown = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!allowed.includes(response.status)) throw new Error(`${name}: expected ${allowed.join("/")}, received ${response.status}: ${text.slice(0, 300)}`);
    return data as T;
  }
  async initialize(name = "session") {
    const response = await this.call<{ ok: true; data: { csrf: string; user: { email: string } } }>(name, "/api/auth/session");
    this.csrf = response.data.csrf;
    return response.data.user;
  }
}

const admin = new Client(adminSession); const fixtureSlug = `acceptance-${Date.now()}`; let contentId = ""; let contentVersion = 0; let editorId = ""; let mediaId = "";
try {
  await new Client().call("missing Access session", "/api/dashboard", {}, [302, 401, 403]);
  const adminUser = await admin.initialize();
  const forged = new Headers({
    "Cf-Access-Jwt-Assertion": adminSession.jwt,
    "Cf-Access-Authenticated-User-Email": "forged@example.com",
    ...(adminSession.cookie ? { Cookie: adminSession.cookie } : {}),
  });
  const forgedResponse = await fetch(`${baseUrl}/api/auth/session`, { headers: forged, redirect: "manual" });
  const forgedBody = await forgedResponse.json() as { ok?: boolean; data?: { user?: { email?: string } } };
  const forgedOk = forgedResponse.status === 200 && forgedBody.data?.user?.email === adminUser.email;
  results.push({ name: "forged identity header", status: forgedResponse.status, ok: forgedOk });
  if (!forgedOk) throw new Error("Forged identity header changed the verified Access identity");
  const dashboard = await admin.call<{ ok: true; data: { counts: Record<string, number> } }>("dashboard", "/api/dashboard");
  if (dashboard.data.counts.products !== 6) throw new Error(`Unexpected product count: ${dashboard.data.counts.products}`);
  const list = await admin.call<{ ok: true; data: { items: Array<{ id: string }> } }>("product list", "/api/products");
  const source = await admin.call<{ ok: true; data: { content_json: string; version: number } }>("product detail", `/api/products/${list.data.items[0].id}`);
  const product = JSON.parse(source.data.content_json) as Record<string, unknown>; product.slug = fixtureSlug; product.title = "Ván MDF acceptance staging"; product.canonical = `https://mdftungphat.com/${fixtureSlug}`;
  const created = await admin.call<{ ok: true; data: { id: string; version: number } }>("content create", "/api/products", { method: "POST", body: JSON.stringify(product) }, 201); contentId = created.data.id; contentVersion = created.data.version;
  const draft = await admin.call<{ ok: true; data: { version: number } }>("draft save", `/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: product, expectedVersion: contentVersion, status: "draft" }) }); contentVersion = draft.data.version;
  const published = await admin.call<{ ok: true; data: { version: number } }>("publish", `/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: product, expectedVersion: contentVersion, status: "published" }) }); contentVersion = published.data.version;
  const unpublished = await admin.call<{ ok: true; data: { version: number } }>("unpublish", `/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: product, expectedVersion: contentVersion, status: "draft" }) }); contentVersion = unpublished.data.version;
  const versions = await admin.call<{ ok: true; data: { results: Array<{ version: number }> } }>("version list", `/api/versions/${contentId}`); const restoreSource = versions.data.results.at(-1)?.version || 1;
  const restored = await admin.call<{ ok: true; data: { version: number } }>("restore", `/api/versions/${contentId}/restore`, { method: "POST", body: JSON.stringify({ version: restoreSource, expectedVersion: contentVersion }) }); contentVersion = restored.data.version;
  const preview = await admin.call<{ ok: true; data: { token: string } }>("preview token", `/api/preview/${contentId}`, { method: "POST", body: "{}" }); await admin.call("preview read", `/api/preview/${contentId}?token=${encodeURIComponent(preview.data.token)}`);

  const users = await admin.call<{ ok: true; data: Array<{ id: string; email: string; status: string }> }>("user list", "/api/users");
  const existingEditor = users.data.find((user) => user.email.toLowerCase() === editorEmail);
  if (existingEditor) {
    editorId = existingEditor.id;
    await admin.call("editor enable", `/api/users/${editorId}`, { method: "PATCH", body: JSON.stringify({ role: "editor", status: "active" }) });
  } else {
    const editor = await admin.call<{ ok: true; data: { id: string; email: string } }>("editor create", "/api/users", { method: "POST", body: JSON.stringify({ email: editorEmail, displayName: "Editor Acceptance", role: "editor" }) }, 201);
    editorId = editor.data.id;
  }
  const editorClient = new Client(editorSession); const editorUser = await editorClient.initialize("editor session");
  if (editorUser.email !== editorEmail) throw new Error("Editor Access token email does not match LIGHT_CMS_EDITOR_EMAIL");
  await editorClient.call("editor audit denied", "/api/audit", {}, 403);
  await editorClient.call("editor publish denied", `/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: product, expectedVersion: contentVersion, status: "published" }) }, 403);
  const editorLogout = await editorClient.call<{ ok: true; data: { logoutUrl: string } }>("editor logout", "/api/auth/logout", { method: "POST", body: "{}" });
  if (editorLogout.data.logoutUrl !== "/cdn-cgi/access/logout") throw new Error("Editor logout did not return the Access logout URL");

  const png = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52]);
  const media = await admin.call<{ ok: true; data: { id: string; uploadUrl: string } }>("media metadata", "/api/media", { method: "POST", body: JSON.stringify({ filename: `${fixtureSlug}.png`, mimeType: "image/png", size: png.byteLength, alt: "Ảnh fixture acceptance staging" }) }, 201); mediaId = media.data.id;
  await admin.call("media upload", media.data.uploadUrl, { method: "PUT", body: png, headers: { "Content-Type": "image/png", "Content-Length": String(png.byteLength) } });
  await admin.call("media delete", `/api/media/${mediaId}`, { method: "DELETE", body: "{}" }); mediaId = "";
  await admin.call("editor deactivate", `/api/users/${editorId}`, { method: "DELETE", body: "{}" }); editorId = "";
  await admin.call("content delete", `/api/products/${contentId}`, { method: "DELETE", body: JSON.stringify({ expectedVersion: contentVersion }) }); contentId = "";
  const snapshotResponse = await admin.call<unknown>("public snapshot", "/api/public/snapshot"); const snapshot = publicSnapshotSchema.parse(snapshotResponse); if (snapshot.records.length !== 8 || snapshot.media.length !== 9) throw new Error(`Snapshot parity failed: records=${snapshot.records.length}, media=${snapshot.media.length}`);
  const logout = await admin.call<{ ok: true; data: { logoutUrl: string } }>("logout", "/api/auth/logout", { method: "POST", body: "{}" });
  if (logout.data.logoutUrl !== "/cdn-cgi/access/logout") throw new Error("Logout did not return the Access logout URL");
  const logoutHeaders = new Headers(); if (adminSession.cookie) logoutHeaders.set("Cookie", adminSession.cookie);
  const accessLogout = await fetch(`${baseUrl}${logout.data.logoutUrl}`, { headers: logoutHeaders, redirect: "manual" });
  results.push({ name: "Access logout endpoint", status: accessLogout.status, ok: [200, 302, 303].includes(accessLogout.status) });
} finally {
  if (mediaId) await admin.call("cleanup media", `/api/media/${mediaId}`, { method: "DELETE", body: "{}" }, [200, 404]).catch(() => undefined);
  if (editorId) await admin.call("cleanup editor", `/api/users/${editorId}`, { method: "DELETE", body: "{}" }, [200, 404]).catch(() => undefined);
  if (contentId) await admin.call("cleanup content", `/api/products/${contentId}`, { method: "DELETE", body: JSON.stringify({ expectedVersion: contentVersion }) }, [200, 404, 409]).catch(() => undefined);
}

const failed = results.filter((result) => !result.ok); const report = { generatedAt: new Date().toISOString(), baseUrl, requests: results.length, failed: failed.length, results };
const output = path.resolve(import.meta.dirname, "../output/acceptance"); fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, "remote-e2e.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ requests: results.length, failed: failed.length }, null, 2)); if (failed.length) process.exitCode = 1;
