const untrustedIdentityPrefixes = ["cf-access-", "x-auth-request-", "x-baogia-", "x-light-cms-internal-"];
const untrustedIdentityHeaders = new Set(["x-forwarded-email", "x-forwarded-user", "x-remote-user"]);

export function gatewayHeaders(request: Request, gateway: string) {
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    const lower = name.toLowerCase();
    if (untrustedIdentityHeaders.has(lower) || untrustedIdentityPrefixes.some((prefix) => lower.startsWith(prefix))) headers.delete(name);
  }
  headers.set("X-Light-CMS-Gateway", gateway);
  const cookie = headers.get("Cookie");
  const retained = cookie?.split(";").map((part) => part.trim()).filter((part) => part && !/^CF_Authorization=/iu.test(part)) || [];
  if (retained.length) headers.set("Cookie", retained.join("; ")); else headers.delete("Cookie");
  return headers;
}

export function cloneGatewayRequest(request: Request, url: string, headers: Headers) {
  const init = { method: request.method, headers, body: request.body, redirect: "manual", duplex: "half" } as RequestInit & { duplex: "half" };
  return new Request(url, init);
}

export function proxyLegacyRequest(request: Request, legacyOrigin: string, gateway: string) {
  const url = new URL(request.url);
  const origin = new URL(legacyOrigin).origin;
  return fetch(cloneGatewayRequest(request, `${origin}${url.pathname}${url.search}`, gatewayHeaders(request, gateway)));
}
