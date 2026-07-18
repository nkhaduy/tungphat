type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
  metadata?: { result_with_testing_key?: boolean };
};

type TurnstileOptions = {
  token: string;
  secret: string;
  remoteIp: string;
  expectedHostname: string;
  expectedAction: string;
  environment: string;
  allowedHostnames: string[];
  allowedHostnameSuffixes: string[];
};

function hostnameAllowed(options: TurnstileOptions) {
  if (options.allowedHostnames.includes(options.expectedHostname)) return true;
  return options.environment !== "production" && options.allowedHostnameSuffixes.some((suffix) => options.expectedHostname.endsWith(suffix));
}

export async function verifyTurnstile(options: TurnstileOptions) {
  if (!hostnameAllowed(options)) return { ok: false, reason: "hostname" } as const;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: options.secret,
        response: options.token,
        remoteip: options.remoteIp,
        idempotency_key: crypto.randomUUID()
      }),
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, reason: "upstream" } as const;
    const result: TurnstileResult = await response.json();
    const productionValid = result.success === true && result.hostname === options.expectedHostname && result.action === options.expectedAction;
    const localTestHost = options.environment !== "production" && ["localhost", "127.0.0.1", "[::1]"].includes(options.expectedHostname);
    const testValid = localTestHost && result.success === true && result.hostname === "example.com" && result.metadata?.result_with_testing_key === true;
    const valid = productionValid || testValid;
    return { ok: valid, reason: valid ? "ok" : "invalid" } as const;
  } catch {
    return { ok: false, reason: "unavailable" } as const;
  } finally {
    clearTimeout(timeout);
  }
}
