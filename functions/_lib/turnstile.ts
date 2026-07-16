type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
  metadata?: { result_with_testing_key?: boolean };
};

export async function verifyTurnstile(token: string, secret: string, remoteIp: string, expectedHostname: string, testMode = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: remoteIp, idempotency_key: crypto.randomUUID() }),
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, reason: "upstream" } as const;
    const result: TurnstileResult = await response.json();
    const productionValid = result.success === true && result.hostname === expectedHostname && result.action === "turnstile-spin-v1";
    const testValid = testMode && result.success === true && result.hostname === "example.com" && result.metadata?.result_with_testing_key === true;
    const valid = productionValid || testValid;
    return { ok: valid, reason: valid ? "ok" : "invalid" } as const;
  } catch {
    return { ok: false, reason: "unavailable" } as const;
  } finally {
    clearTimeout(timeout);
  }
}
