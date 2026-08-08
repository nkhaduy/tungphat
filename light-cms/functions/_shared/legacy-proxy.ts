const identityHeaders = [
  "Cf-Access-Authenticated-User-Email",
  "Cf-Access-User-Email",
  "Cf-Access-Client-Id",
  "Cf-Access-Client-Secret",
  "X-Auth-Request-Email",
  "X-Forwarded-Email",
  "X-Forwarded-User",
  "X-Remote-User",
];

export function gatewayHeaders(request: Request, gateway: string, preserveAssertion: boolean) {
  const headers = new Headers(request.headers);
  if (!preserveAssertion) headers.delete("Cf-Access-Jwt-Assertion");
  for (const name of identityHeaders) headers.delete(name);
  headers.set("X-Light-CMS-Gateway", gateway);
  if (!preserveAssertion) {
    const cookie = headers.get("Cookie");
    const retained = cookie?.split(";").map((part) => part.trim()).filter((part) => part && !/^CF_Authorization=/iu.test(part)) || [];
    if (retained.length) headers.set("Cookie", retained.join("; ")); else headers.delete("Cookie");
  }
  return headers;
}

export function cloneGatewayRequest(request: Request, url: string, headers: Headers) {
  const init = { method: request.method, headers, body: request.body, redirect: "manual", duplex: "half" } as RequestInit & { duplex: "half" };
  return new Request(url, init);
}

export function proxyLegacyRequest(request: Request, legacyOrigin: string, gateway: string) {
  const url = new URL(request.url);
  const origin = new URL(legacyOrigin).origin;
  return fetch(cloneGatewayRequest(request, `${origin}${url.pathname}${url.search}`, gatewayHeaders(request, gateway, false)));
}
