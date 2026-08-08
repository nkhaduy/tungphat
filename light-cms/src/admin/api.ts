export type AdminUser = { id: string; email: string; name: string; role: "super-admin" | "admin" | "editor" };
type ApiError = { ok: false; error: { code: string; message: string; requestId: string; fields?: Record<string, string> } };
type ApiSuccess<T> = { ok: true; data: T; requestId?: string };

let csrfToken = "";

async function request<T>(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  const payload = await response.json() as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? `HTTP ${response.status}` : payload.error.message);
  return payload.data;
}

export async function session() {
  const data = await request<{ user: AdminUser; csrf: string; expiresAt: number }>("/api/auth/session");
  csrfToken = data.csrf;
  return data;
}

export async function logout() {
  try { return await request<{ loggedOut: true; logoutUrl: string }>("/api/auth/logout", { method: "POST" }); } finally { csrfToken = ""; }
}

export function accessLoginUrl() { return "/"; }

export const api = {
  dashboard: () => request<{ counts: Record<string, number>; published: number }>("/api/dashboard"),
  list: (collection: string) => request<{ items: Array<{ id: string; title: string; slug: string; status: string; version: number; updatedAt: string }> }>(`/api/${collection}`),
  detail: (collection: string, id: string) => request<Record<string, unknown>>(`/api/${collection}/${id}`),
  save: (collection: string, id: string, data: unknown, expectedVersion: number, status: "draft" | "published") => request(`/api/${collection}/${id}`, { method: "PATCH", body: JSON.stringify({ data, expectedVersion, status }) }),
  settings: (key: string) => request<{ data: Record<string, unknown>; version: number }>(`/api/settings/${key}`),
  saveSettings: (key: string, data: unknown, expectedVersion: number) => request(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ data, expectedVersion }) }),
  media: () => request<{ results?: unknown[] } | unknown[]>("/api/media"),
  createMedia: (metadata: { filename: string; mimeType: string; size: number; alt: string }) => request<{ id: string; uploadUrl: string }>("/api/media", { method: "POST", body: JSON.stringify(metadata) }),
  uploadMedia: async (url: string, file: File) => {
    const response = await fetch(url, { method: "PUT", body: file, credentials: "include", headers: { "Content-Type": file.type, "X-CSRF-Token": csrfToken } });
    if (!response.ok) throw new Error((await response.json() as ApiError).error?.message || "Upload thất bại");
  },
  users: () => request<AdminUser[]>("/api/users"),
  audit: () => request<unknown[]>("/api/audit"),
};
