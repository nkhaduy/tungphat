export type GbpAdminSession = {
  userId: string;
  email: string;
  name: string;
  role: "super-admin" | "admin" | "editor";
  csrf: string;
  expiresAt: number;
};

export async function authenticateGbpAdmin(request: Request, api: Fetcher): Promise<GbpAdminSession | null> {
  const headers = new Headers({ Accept: "application/json" });
  const cookie = request.headers.get("Cookie");
  if (cookie) headers.set("Cookie", cookie);
  const response = await api.fetch(new Request("https://light-cms-internal/api/auth/session", { headers }));
  if (!response.ok) return null;
  const payload = await response.json() as { ok?: boolean; data?: { user?: { id: string; email: string; name: string; role: GbpAdminSession["role"] }; csrf?: string; expiresAt?: number } };
  const user = payload.data?.user;
  if (!payload.ok || !user?.id || !payload.data?.csrf || !payload.data.expiresAt) return null;
  return { userId: user.id, email: user.email, name: user.name, role: user.role, csrf: payload.data.csrf, expiresAt: payload.data.expiresAt };
}

export function validMutation(request: Request, session: GbpAdminSession, allowedOrigins: string) {
  const origin = request.headers.get("Origin");
  const csrf = request.headers.get("X-CSRF-Token") || "";
  return Boolean(origin && allowedOrigins.split(",").map((value) => value.trim()).includes(origin) && csrf && csrf === session.csrf);
}
