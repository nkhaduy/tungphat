export type AdminUser = { id: string; email: string; name: string; role: "super-admin" | "admin" | "editor" };
export type BaogiaUser = { id: string; baogia_username: string; display_name: string; role: AdminUser["role"]; status: "active" | "disabled"; last_login_at?: string | null };
export type GbpStatus = {
  configured: boolean;
  connection: null | { project_id?: string; account_name?: string; location_name?: string; location_title?: string; location_maps_uri?: string; status?: string; last_sync_succeeded_at?: number; last_error_safe?: string };
  reviews: { total?: number; average?: number; last_sync?: number; latest: Array<{ reviewer_display_name: string; rating: number; comment?: string | null; update_time?: string | null }> };
  metrics: Array<{ metric_date: string; metric_name: string; metric_value: number }>;
  keywords: Array<{ month: string; keyword: string; impressions?: number | null; threshold?: number | null }>;
  retentionDays: number;
};
export type ContentListItem = { id: string; title: string; slug: string; status: "draft" | "published"; version: number; updatedAt: string; featuredImage?: string; category?: string; supplier?: string };
type ApiError = { ok: false; error: { code: string; message: string; requestId: string; fields?: Record<string, string> } };
type ApiSuccess<T> = { ok: true; data: T; requestId?: string };

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string, public readonly fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiRequestError";
  }
}

let csrfToken = "";

async function request<T>(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  const payload = await response.json() as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.ok) throw new ApiRequestError(payload.ok ? `HTTP ${response.status}` : payload.error.message, response.status, payload.ok ? "http_error" : payload.error.code, payload.ok ? {} : payload.error.fields || {});
  return payload.data;
}

export async function session() {
  const data = await request<{ user: AdminUser; csrf: string; expiresAt: number }>("/api/auth/session");
  csrfToken = data.csrf;
  return data;
}

export async function logout() {
  try { return await request<{ loggedOut: true }>("/api/auth/logout", { method: "POST" }); } finally { csrfToken = ""; }
}

export function ssoLoginUrl() { return "/api/auth/sso/start"; }

export const api = {
  dashboard: () => request<{ counts: Record<string, number>; published: number }>("/api/dashboard"),
  list: (collection: string) => request<{ items: ContentListItem[] }>(`/api/${collection}`),
  detail: (collection: string, id: string) => request<Record<string, unknown>>(`/api/${collection}/${id}`),
  save: (collection: string, id: string, data: unknown, expectedVersion: number, status: "draft" | "published") => request<{ version: number }>(`/api/${collection}/${id}`, { method: "PATCH", body: JSON.stringify({ data, expectedVersion, status }) }),
  settings: (key: string) => request<{ data: Record<string, unknown>; version: number }>(`/api/settings/${key}`),
  saveSettings: (key: string, data: unknown, expectedVersion: number) => request<{ key: string; version: number }>(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ data, expectedVersion }) }),
  media: () => request<{ results?: unknown[] } | unknown[]>("/api/media"),
  createMedia: (metadata: { filename: string; mimeType: string; size: number; alt: string }) => request<{ id: string; uploadUrl: string }>("/api/media", { method: "POST", body: JSON.stringify(metadata) }),
  uploadMedia: async (url: string, file: File) => {
    const response = await fetch(url, { method: "PUT", body: file, credentials: "include", headers: { "Content-Type": file.type, "X-CSRF-Token": csrfToken } });
    if (!response.ok) throw new Error((await response.json() as ApiError).error?.message || "Upload thất bại");
  },
  updateMedia: (id: string, data: { alt: string; caption: string }) => request<{ id: string; alt: string; caption: string }>(`/api/media/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMedia: (id: string) => request<{ id: string; deleted: true }>(`/api/media/${encodeURIComponent(id)}`, { method: "DELETE" }),
  users: () => request<BaogiaUser[]>("/api/users"),
  audit: () => request<unknown[]>("/api/audit"),
  gbp: () => request<GbpStatus>("/api/admin/gbp"),
  syncGbp: () => request<{ reviews: number; metrics: number; keywords: number; syncedAt: number }>("/api/admin/gbp/sync", { method: "POST" }),
};
