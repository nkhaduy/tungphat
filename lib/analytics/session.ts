const VISITOR_COOKIE = "tp_vid";
const SESSION_COOKIE = "tp_sid";
const OPT_OUT_COOKIE = "tp_analytics_opt_out";
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function cookie(name: string) {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ""
  );
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function setCookie(name: string, value: string, maxAge: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function analyticsOptedOut() {
  return cookie(OPT_OUT_COOKIE) === "1";
}

export function generateAnonymousId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export function getAnalyticsIdentity(now = Date.now()) {
  let visitorId = cookie(VISITOR_COOKIE);
  if (!validUuid(visitorId)) {
    visitorId = generateAnonymousId();
    setCookie(VISITOR_COOKIE, visitorId, 365 * 24 * 60 * 60);
  }

  const lastActivity = Number(
    sessionStorage.getItem("tp_session_last_activity") || 0,
  );
  let sessionId = cookie(SESSION_COOKIE);
  const expired = !lastActivity || now - lastActivity > SESSION_TIMEOUT_MS;
  if (!validUuid(sessionId) || expired) {
    sessionId = generateAnonymousId();
    sessionStorage.removeItem("tp_session_attribution");
  }
  setCookie(SESSION_COOKIE, sessionId, 30 * 60);
  sessionStorage.setItem("tp_session_last_activity", String(now));
  return { visitorId, sessionId, isNewSession: expired };
}

export function clearAnalyticsIdentity() {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${VISITOR_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  sessionStorage.removeItem("tp_session_last_activity");
  sessionStorage.removeItem("tp_session_attribution");
}
