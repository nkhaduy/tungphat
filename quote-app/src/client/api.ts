let csrfToken = "";

export function setCsrfToken(value: string): void {
  csrfToken = value;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string, public readonly requestId?: string) {
    super(message);
  }
}

export async function refreshSessionForUser(userId: string): Promise<void> {
  const result = await api<{ user: { id: string }; csrf: string }>("/api/auth/session");
  if (result.user.id !== userId) throw new Error("Tài khoản vừa đăng nhập khác tài khoản đang lập báo giá. Hãy đăng nhập lại bằng tài khoản ban đầu.");
  setCsrfToken(result.csrf);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (init.method && init.method !== "GET" && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Yêu cầu không thành công." })) as { message?: string; code?: string; requestId?: string };
    throw new ApiError(response.status, body.message ?? "Yêu cầu không thành công.", body.code, body.requestId ?? response.headers.get("X-Request-Id") ?? undefined);
  }
  const data: unknown = await response.json();
  return data as T;
}

export async function apiWithTimeout<T>(path: string, init: Omit<RequestInit, "signal">, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await api<T>(path, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadProtected(path: string, filename: string): Promise<void> {
  const response = await fetch(path, { credentials: "same-origin" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Không thể tải file." })) as { message?: string };
    throw new ApiError(response.status, body.message ?? "Không thể tải file.");
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
