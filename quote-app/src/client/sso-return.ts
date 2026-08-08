const baogiaOrigin = "https://baogia.mdftungphat.com";
const statePattern = /^[A-Za-z0-9_-]{32,128}$/u;

export function safeSsoReturn(search: string): string | null {
  const value = new URLSearchParams(search).get("returnTo");
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const target = new URL(value, baogiaOrigin);
    const keys = [...target.searchParams.keys()];
    const state = target.searchParams.get("state") ?? "";
    if (target.origin !== baogiaOrigin || target.pathname !== "/api/auth/sso/cms" || target.hash || keys.length !== 1 || keys[0] !== "state" || !statePattern.test(state)) return null;
    return `/api/auth/sso/cms?state=${state}`;
  } catch {
    return null;
  }
}
