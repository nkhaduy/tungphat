const auditHeaderNames = ["cache-control", "content-type", "content-security-policy", "strict-transport-security", "x-content-type-options", "x-robots-tag", "referrer-policy", "permissions-policy"];

export async function fetchAuditResource(url: string, userAgent: string, fetcher: typeof fetch = fetch, timeoutMs = 15000) {
  const response = await fetcher(url, { redirect: "manual", headers: { "user-agent": userAgent, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }, signal: AbortSignal.timeout(timeoutMs) });
  const body = await response.text();
  const headers: Record<string, string> = {};
  for (const key of auditHeaderNames) {
    const value = response.headers.get(key);
    if (value) headers[key] = value;
  }
  return { status: response.status, location: response.headers.get("location"), body, headers };
}
