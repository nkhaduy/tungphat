import fs from "node:fs";
import path from "node:path";
import { applyAccessSession, readAccessSession } from "./access-session-input";

const baseUrl = process.env.LIGHT_CMS_STAGING_URL || "https://tungphat-light-cms-20260805-0855-staging.pages.dev";
const accessSession = readAccessSession(process.env, "ADMIN");
type Sample = { route: string; method: string; status: number; wallMs: number; responseBytes: number; d1Queries: number; jwksCache: string; jwksFetches: number; error?: string };
const samples: Sample[] = [];

class Client {
  csrf = "";
  async call<T>(route: string, init: RequestInit = {}, expected = 200): Promise<T> {
    const started = performance.now(); const method = (init.method || "GET").toUpperCase(); const headers = new Headers(init.headers);
    if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
    applyAccessSession(headers, accessSession);
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) { headers.set("Origin", baseUrl); if (this.csrf) headers.set("X-CSRF-Token", this.csrf); }
    let response: Response | null = null; let text = "";
    try {
      response = await fetch(`${baseUrl}${route}`, { ...init, headers }); text = await response.text();
      const parsed = text ? JSON.parse(text) as { ok?: boolean; data?: T; error?: { message?: string } } : {};
      const ok = response.status === expected;
      samples.push({ route, method, status: response.status, wallMs: performance.now() - started, responseBytes: new TextEncoder().encode(text).byteLength, d1Queries: Number(response.headers.get("X-D1-Query-Count") || 0), jwksCache: response.headers.get("X-Access-JWKS-Cache") || "none", jwksFetches: Number(response.headers.get("X-Access-JWKS-Fetches") || 0), ...(ok ? {} : { error: parsed.error?.message || text.slice(0, 180) }) });
      if (!ok) throw new Error(`${method} ${route}: ${response.status}`);
      return (parsed.data === undefined ? parsed : parsed.data) as T;
    } catch (error) {
      if (!response) samples.push({ route, method, status: 0, wallMs: performance.now() - started, responseBytes: 0, d1Queries: 0, jwksCache: "none", jwksFetches: 0, error: String(error) });
      throw error;
    }
  }
}

async function parallel<T>(count: number, fn: (index: number) => Promise<T>) { return Promise.all(Array.from({ length: count }, (_, index) => fn(index))); }
const png = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52]);

const admin = new Client(); let contentId = ""; let version = 0; const fixtureSlug = `benchmark-${Date.now()}`; const createdMedia: string[] = [];
try {
  const session = await admin.call<{ csrf: string }>("/api/auth/session"); admin.csrf = session.csrf;
  const list = await admin.call<{ items: Array<{ id: string }> }>("/api/products"); const detail = await admin.call<{ content_json: string; version: number }>(`/api/products/${list.items[0].id}`);
  const content = JSON.parse(detail.content_json) as Record<string, unknown>; content.slug = fixtureSlug; content.title = "Ván MDF benchmark staging"; content.canonical = `https://mdftungphat.com/${fixtureSlug}`;
  const created = await admin.call<{ id: string; version: number }>("/api/products", { method: "POST", body: JSON.stringify(content) }, 201); contentId = created.id; version = created.version;

  await parallel(100, () => admin.call("/api/auth/session"));
  await parallel(100, () => admin.call("/api/dashboard"));
  await parallel(50, () => admin.call("/api/products"));
  await parallel(50, () => admin.call(`/api/products/${contentId}`));
  await parallel(200, () => admin.call("/api/public/snapshot"));

  for (let index = 0; index < 50; index += 1) { const result = await admin.call<{ version: number }>(`/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: content, expectedVersion: version, status: "draft" }) }); version = result.version; }
  for (let index = 0; index < 10; index += 1) {
    const published = await admin.call<{ version: number }>(`/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: content, expectedVersion: version, status: "published" }) }); version = published.version;
    const draft = await admin.call<{ version: number }>(`/api/products/${contentId}`, { method: "PATCH", body: JSON.stringify({ data: content, expectedVersion: version, status: "draft" }) }); version = draft.version;
  }
  const versions = await admin.call<{ results: Array<{ version: number }> }>(`/api/versions/${contentId}`); const restoreTarget = versions.results.at(-1)?.version || 1;
  for (let index = 0; index < 20; index += 1) { const restored = await admin.call<{ version: number }>(`/api/versions/${contentId}/restore`, { method: "POST", body: JSON.stringify({ version: restoreTarget, expectedVersion: version }) }); version = restored.version; }
  await parallel(20, async () => { const media = await admin.call<{ id: string }>("/api/media", { method: "POST", body: JSON.stringify({ filename: `benchmark-${Date.now()}.png`, mimeType: "image/png", size: png.byteLength, alt: "Ảnh benchmark staging" }) }, 201); createdMedia.push(media.id); await admin.call(`/api/media/${media.id}`, { method: "DELETE", body: "{}" }); });
  await parallel(10, async () => { const media = await admin.call<{ id: string; uploadUrl: string }>("/api/media", { method: "POST", body: JSON.stringify({ filename: `benchmark-upload-${Date.now()}.png`, mimeType: "image/png", size: png.byteLength, alt: "Ảnh upload benchmark staging" }) }, 201); createdMedia.push(media.id); await admin.call(media.uploadUrl, { method: "PUT", body: png, headers: { "Content-Type": "image/png", "Content-Length": String(png.byteLength) } }); await admin.call(`/api/media/${media.id}`, { method: "DELETE", body: "{}" }); });
} finally {
  for (const id of createdMedia) await admin.call(`/api/media/${id}`, { method: "DELETE", body: "{}" }, 200).catch(() => undefined);
  if (contentId) await admin.call(`/api/products/${contentId}`, { method: "DELETE", body: JSON.stringify({ expectedVersion: version }) }, 200).catch(() => undefined);
  await admin.call("/api/auth/logout", { method: "POST", body: "{}" }, 200).catch(() => undefined);
}

const byRoute = new Map<string, Sample[]>(); for (const sample of samples) byRoute.set(sample.route, [...(byRoute.get(sample.route) || []), sample]);
const percentile = (values: number[], p: number) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] || 0; };
const routeStats = Object.fromEntries([...byRoute.entries()].map(([route, routeSamples]) => { const walls = routeSamples.map((sample) => sample.wallMs); return [route, { count: routeSamples.length, wallP50: percentile(walls, .5), wallP95: percentile(walls, .95), wallP99: percentile(walls, .99), wallMax: Math.max(...walls), maxD1Queries: Math.max(...routeSamples.map((sample) => sample.d1Queries)), jwksCache: Object.fromEntries([...new Set(routeSamples.map((sample) => sample.jwksCache))].map((status) => [status, routeSamples.filter((sample) => sample.jwksCache === status).length])), maxJwksFetches: Math.max(...routeSamples.map((sample) => sample.jwksFetches)), statuses: Object.fromEntries([...new Set(routeSamples.map((sample) => sample.status))].map((status) => [status, routeSamples.filter((sample) => sample.status === status).length])) }]; }));
const jwksCacheMetrics = Object.fromEntries([...new Set(samples.map((sample) => sample.jwksCache))].map((status) => [status, samples.filter((sample) => sample.jwksCache === status).length]));
const report = { generatedAt: new Date().toISOString(), baseUrl, requests: samples.length, errors: samples.filter((sample) => sample.status >= 500 || sample.status === 0).length, worker1102: null, cpu: null, jwksCacheMetrics, maxJwksFetches: Math.max(...samples.map((sample) => sample.jwksFetches)), routeStats, samples };
const output = path.resolve(import.meta.dirname, "../output/benchmark"); fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, "benchmark.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ requests: report.requests, errors: report.errors, routes: Object.keys(routeStats).length }, null, 2)); if (report.errors > 0) process.exitCode = 1;
